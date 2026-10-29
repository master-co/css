import { chmod, mkdir, readFile, rm } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { execa } from 'execa'
// Reuse the published authentication API; none of its pnpm execution hooks run.
import { createAuthNpmrc, getChannel, readPackage, resolveRegistry, writeReleaseVersion } from '@aronrepo/semantic-release-pnpm'

export function packedManifest(archive) {
  const tar = gunzipSync(archive)
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512)
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    const size = Number.parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim() || '0', 8)
    if (!Number.isSafeInteger(size) || size < 0) throw new Error('Invalid release tarball header')
    if (name === 'package/package.json') return JSON.parse(tar.subarray(offset + 512, offset + 512 + size).toString())
    offset += 512 + Math.ceil(size / 512) * 512
  }
  throw new Error('Release tarball is missing package/package.json')
}

export function validatePackedManifest(manifest, expectedName, version) {
  if (manifest.name !== expectedName || manifest.version !== version) throw new Error(`Incorrect release identity for ${expectedName}@${version}`)
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies']) {
    for (const [name, value] of Object.entries(manifest[field] || {})) {
      if (String(value).startsWith('workspace:')) throw new Error(`Unresolved workspace dependency ${manifest.name}: ${name}`)
    }
  }
}

export function createWorkspaceRelease({ run = execa, auth = createAuthNpmrc } = {}) {
  const versions = new Map()
  const tarballs = new Map()
  const credentials = new Map()

  async function execute(command, args, context, options = {}) {
    const child = run(command, args, { cwd: context.cwd, env: context.env, preferLocal: true, ...options })
    if (context.stdout) child.stdout?.pipe(context.stdout, { end: false })
    if (context.stderr) child.stderr?.pipe(context.stderr, { end: false })
    return await child
  }

  async function authenticatedContext(pkg, context) {
    const registry = resolveRegistry(pkg, context)
    const key = `${context.cwd}:${pkg.name}:${registry}`
    if (!credentials.has(key)) {
      const npmrc = await auth(pkg, context, registry)
      await chmod(npmrc, 0o600)
      credentials.set(key, npmrc)
      // Exchanged OIDC publish tokens are package scoped and cannot call whoami.
      if (context.env.GITHUB_ACTIONS !== 'true' && !context.env.NPM_ID_TOKEN) {
        await execute('npm', ['whoami', '--registry', registry], context, { env: { ...context.env, NPM_CONFIG_USERCONFIG: npmrc } })
      }
    }
    return { ...context, registry, env: { ...context.env, NPM_CONFIG_USERCONFIG: credentials.get(key) } }
  }

  async function prepare(config, context) {
    const cwd = context.cwd ?? process.cwd()
    const version = context.nextRelease.version
    const roots = config.workspaceRoots
    if (!Array.isArray(roots) || !roots.includes(config.pkgRoot)) throw new Error('Release configuration must declare every workspace root')
    const key = `${cwd}:${version}`
    if (!versions.has(key)) {
      versions.set(key, (async () => {
        // Every workspace version must be set before Bun resolves workspace:*.
        for (const root of roots) await writeReleaseVersion(cwd, root, version)
      })())
    }
    await versions.get(key)
    const pkg = await readPackage(cwd, config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return
    const directory = resolve(cwd, config.tarballDir || 'release-artifacts/packages')
    await mkdir(directory, { recursive: true })
    const archive = join(directory, `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`)
    await execute('bun', ['pm', 'pack', '--filename', archive, '--ignore-scripts'], context, { cwd: resolve(cwd, config.pkgRoot) })
    validatePackedManifest(packedManifest(await readFile(archive)), pkg.name, version)
    tarballs.set(`${cwd}:${config.pkgRoot}:${version}`, archive)
  }

  async function verifyConditions(config, context) {
    const pkg = await readPackage(context.cwd ?? process.cwd(), config.pkgRoot)
    if (!pkg.private && config.npmPublish !== false) await authenticatedContext(pkg, context)
  }

  async function publish(config, context) {
    const cwd = context.cwd ?? process.cwd()
    const pkg = await readPackage(cwd, config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return false
    const key = `${cwd}:${config.pkgRoot}:${context.nextRelease.version}`
    if (!tarballs.has(key)) await prepare(config, context)
    const authenticated = await authenticatedContext(pkg, context)
    const channel = getChannel(context.nextRelease.channel)
    const args = ['publish', tarballs.get(key), '--tag', channel, '--registry', authenticated.registry, '--ignore-scripts']
    if (pkg.publishConfig?.provenance) args.push('--provenance')
    await execute('npm', args, authenticated)
    return { name: `npm package (@${channel} dist-tag)`, channel, url: `https://www.npmjs.com/package/${pkg.name}/v/${context.nextRelease.version}` }
  }

  async function addChannel(config, context) {
    const pkg = await readPackage(context.cwd ?? process.cwd(), config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return false
    const authenticated = await authenticatedContext(pkg, context)
    const channel = getChannel(context.nextRelease.channel)
    await execute('npm', ['dist-tag', 'add', `${pkg.name}@${context.nextRelease.version}`, channel, '--registry', authenticated.registry], authenticated)
    return { name: `npm package (@${channel} dist-tag)`, channel }
  }

  async function cleanup() {
    await Promise.all([...credentials.values()].map(file => rm(file, { force: true })))
    credentials.clear()
    versions.clear()
    tarballs.clear()
  }
  return { verifyConditions, prepare, publish, addChannel, success: cleanup, fail: cleanup }
}

const release = createWorkspaceRelease()
export const { verifyConditions, prepare, publish, addChannel, success, fail } = release
