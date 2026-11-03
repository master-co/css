import { mkdir, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { execa } from 'execa'
// Reuse manifest/version helpers only; npm CLI owns OIDC authentication.
import { getChannel, readPackage, writeReleaseVersion } from '@aronrepo/semantic-release-pnpm'
import { assertNpmOidcEnvironment, assertNpmPublishConfig, createNpmOidcSession, npmRegistry } from './npm-oidc.mjs'

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
  assertNpmPublishConfig(manifest)
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies']) {
    for (const [name, value] of Object.entries(manifest[field] || {})) {
      if (String(value).startsWith('workspace:')) throw new Error(`Unresolved workspace dependency ${manifest.name}: ${name}`)
    }
  }
}

export function createWorkspaceRelease({ run = execa } = {}) {
  const versions = new Map()
  const tarballs = new Map()

  async function execute(command, args, context, options = {}) {
    const child = run(command, args, { cwd: context.cwd, env: context.env, preferLocal: true, ...options })
    if (context.stdout) child.stdout?.pipe(context.stdout, { end: false })
    if (context.stderr) child.stderr?.pipe(context.stderr, { end: false })
    return await child
  }

  async function executeNpm(pkg, args, context) {
    assertNpmPublishConfig(pkg)
    const { cleanup, ...options } = await createNpmOidcSession(context.env)
    try {
      await execute('npm', [...args, '--registry', npmRegistry], context, options)
    } finally {
      await cleanup()
    }
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
    if (!pkg.private && config.npmPublish !== false) {
      assertNpmOidcEnvironment(context.env)
      assertNpmPublishConfig(pkg)
    }
  }

  async function publish(config, context) {
    const cwd = context.cwd ?? process.cwd()
    const pkg = await readPackage(cwd, config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return false
    assertNpmOidcEnvironment(context.env)
    assertNpmPublishConfig(pkg)
    const key = `${cwd}:${config.pkgRoot}:${context.nextRelease.version}`
    if (!tarballs.has(key)) await prepare(config, context)
    const channel = getChannel(context.nextRelease.channel)
    const args = ['publish', tarballs.get(key), '--tag', channel, '--ignore-scripts']
    if (pkg.publishConfig?.provenance) args.push('--provenance')
    await executeNpm(pkg, args, context)
    return { name: `npm package (@${channel} dist-tag)`, channel, url: `https://www.npmjs.com/package/${pkg.name}/v/${context.nextRelease.version}` }
  }

  async function addChannel(config, context) {
    const pkg = await readPackage(context.cwd ?? process.cwd(), config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return false
    const channel = getChannel(context.nextRelease.channel)
    await executeNpm(pkg, ['dist-tag', 'add', `${pkg.name}@${context.nextRelease.version}`, channel], context)
    return { name: `npm package (@${channel} dist-tag)`, channel }
  }

  async function cleanup() {
    versions.clear()
    tarballs.clear()
  }
  return { verifyConditions, prepare, publish, addChannel, success: cleanup, fail: cleanup }
}

const release = createWorkspaceRelease()
export const { verifyConditions, prepare, publish, addChannel, success, fail } = release
