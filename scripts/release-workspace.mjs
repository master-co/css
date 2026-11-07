import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { execa } from 'execa'
// Reuse manifest/version helpers only; npm CLI owns OIDC authentication.
import { readPackage, writeReleaseVersion } from './release-manifest.mjs'
import { assertNpmOidcEnvironment, assertNpmProvenanceRepository, assertNpmPublishConfig, createNpmOidcSession, npmRegistry } from './npm-oidc.mjs'
import { assertReleaseFlag, recoveryArchive, stagePackage } from './release-promotion.mjs'

function* packedEntries(archive) {
  const tar = gunzipSync(archive)
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512)
    const filename = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    const prefix = header.subarray(345, 500).toString().replace(/\0.*$/, '')
    const name = prefix ? `${prefix}/${filename}` : filename
    const size = Number.parseInt(header.subarray(124, 136).toString().replace(/\0.*$/, '').trim() || '0', 8)
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > tar.length) throw new Error('Invalid release tarball header')
    if (name) yield { name, content: tar.subarray(offset + 512, offset + 512 + size) }
    offset += 512 + Math.ceil(size / 512) * 512
  }
}

export function packedManifest(archive) {
  for (const { name, content } of packedEntries(archive)) {
    if (name === 'package/package.json') return JSON.parse(content.toString())
  }
  throw new Error('Release tarball is missing package/package.json')
}

export function validatePackedArchive(archive, expectedName, version, gitHead) {
  const manifest = packedManifest(archive)
  validatePackedManifest(manifest, expectedName, version)
  if (gitHead !== undefined) assert.equal(manifest.gitHead, gitHead, `Incorrect packed Git HEAD for ${expectedName}@${version}`)
  if (expectedName !== '@master/css-binding') return
  for (const { name } of packedEntries(archive)) {
    if (/^package\/artifacts(?:\/|$)|\.node$|(?:^|\/)mcss(?:\.exe)?$/.test(name)) {
      throw new Error(`Generic @master/css-binding tarball contains native artifact ${name}; native binaries belong in target packages`)
    }
  }
}

export function validatePackedManifest(manifest, expectedName, version) {
  if (manifest.name !== expectedName || manifest.version !== version) throw new Error(`Incorrect release identity for ${expectedName}@${version}`)
  assertNpmPublishConfig(manifest)
  assertNpmProvenanceRepository(manifest)
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies']) {
    for (const [name, value] of Object.entries(manifest[field] || {})) {
      if (String(value).startsWith('workspace:')) throw new Error(`Unresolved workspace dependency ${manifest.name}: ${name}`)
    }
  }
}

export function createWorkspaceRelease({ run = execa, fetchMetadata = fetch, wait } = {}) {
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
    const { version, gitHead } = context.nextRelease
    assert.match(gitHead ?? '', /^[a-f0-9]{40}$/, 'Release packing requires the full source Git HEAD')
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
    const recovered = await recoveryArchive(config, context, pkg.name)
    if (recovered) {
      validatePackedArchive(await readFile(recovered), pkg.name, version, gitHead)
      tarballs.set(`${cwd}:${config.pkgRoot}:${version}`, recovered)
      return
    }
    const packageRoot = resolve(cwd, config.pkgRoot)
    // Bun does not insert gitHead when packing, and npm publishes the tarball's manifest.
    if (pkg.gitHead !== undefined) assert.equal(pkg.gitHead, gitHead, `Existing Git HEAD differs for ${pkg.name}@${version}`)
    if (pkg.gitHead === undefined || pkg.devDependencies !== undefined) {
      pkg.gitHead = gitHead
      // Build-only workspace helpers are bundled before packing and may have no version.
      delete pkg.devDependencies
      await writeFile(join(packageRoot, 'package.json'), JSON.stringify(pkg, null, 4) + '\n')
    }
    const directory = resolve(cwd, config.tarballDir || 'release-artifacts/packages')
    await mkdir(directory, { recursive: true })
    const archive = join(directory, `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`)
    await execute('bun', ['pm', 'pack', '--filename', archive, '--ignore-scripts'], context, { cwd: packageRoot })
    validatePackedArchive(await readFile(archive), pkg.name, version, gitHead)
    tarballs.set(`${cwd}:${config.pkgRoot}:${version}`, archive)
  }

  async function verifyConditions(config, context) {
    const pkg = await readPackage(context.cwd ?? process.cwd(), config.pkgRoot)
    if (!pkg.private && config.npmPublish !== false) {
      assertNpmOidcEnvironment(context.env)
      assertNpmPublishConfig(pkg)
      assertNpmProvenanceRepository(pkg, config.pkgRoot)
      assertReleaseFlag(context, 'MASTER_CSS_RELEASE_STAGE')
    }
  }

  async function publish(config, context) {
    const cwd = context.cwd ?? process.cwd()
    const pkg = await readPackage(cwd, config.pkgRoot)
    if (pkg.private || config.npmPublish === false) return false
    assertNpmOidcEnvironment(context.env)
    assertNpmPublishConfig(pkg)
    assertReleaseFlag(context, 'MASTER_CSS_RELEASE_STAGE')
    const key = `${cwd}:${config.pkgRoot}:${context.nextRelease.version}`
    if (!tarballs.has(key)) await prepare(config, context)
    // The promotion module verifies every remaining upload before any formal tag write.
    const channel = await stagePackage(config, context, pkg, tarballs.get(key), executeNpm, fetchMetadata, { deferVerification: true, wait })
    return { name: `npm package (@${channel} dist-tag)`, channel, url: `https://www.npmjs.com/package/${pkg.name}/v/${context.nextRelease.version}` }
  }

  async function cleanup() {
    versions.clear()
    tarballs.clear()
  }
  // Packages never promote themselves; the promotion module verifies the entire cohort first.
  return { verifyConditions, prepare, publish, success: cleanup, fail: cleanup }
}
