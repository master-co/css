import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const repository = 'master-co/css'
export const identityPath = 'site-release.json'
export const channels = {
  main: { deliveryBranch: 'codex/pages-stable', origin: 'https://css.master.co' },
  rc: { deliveryBranch: 'codex/pages-rc', origin: 'https://rc.css.master.co' }
}
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')
const metadataKeys = ['repository', 'revision', 'releaseRevision', 'version', 'tag', 'channel', 'deliveryBranch', 'project', 'subdomain', 'origin', 'imageTransformations', 'legacyDesignCutover']

export function releaseMetadata(input) {
  const result = Object.fromEntries(metadataKeys.map(key => [key, input[key]]))
  assert.equal(result.repository, repository, 'Only the first-party release repository is supported')
  assert.match(result.revision ?? '', /^[a-f0-9]{40}$/, 'An exact site source revision is required')
  // The site documents the packages of one published release. A release push builds that
  // release commit itself; a later site-only commit keeps its unchanged package sources.
  assert.match(result.releaseRevision ?? '', /^[a-f0-9]{40}$/, 'The exact source revision of the documented release is required')
  assert.ok(Object.hasOwn(channels, result.channel), 'Only main and rc can deliver the site')
  assert.match(result.version ?? '', result.channel === 'main' ? /^\d+\.\d+\.\d+$/ : /^\d+\.\d+\.\d+-rc\.\d+$/, 'Version must match the logical release channel')
  assert.equal(result.tag, `v${result.version}`, 'The exact published version tag is required')
  assert.equal(result.deliveryBranch, channels[result.channel].deliveryBranch)
  assert.equal(result.origin, channels[result.channel].origin)
  assert.match(result.project ?? '', /^[a-z0-9][a-z0-9-]{0,62}$/, 'A Pages project name is required')
  assert.match(result.subdomain ?? '', /^[a-z0-9][a-z0-9-]{0,62}\.pages\.dev$/, 'Use the actual Pages subdomain, independently of the project name')
  assert.equal(result.imageTransformations, false, 'Both builders must use portable images')
  result.legacyDesignCutover ??= false
  assert.equal(typeof result.legacyDesignCutover, 'boolean', 'Cutover must be an explicit boolean')
  return result
}

export function manifestName(metadata) {
  return `site-${metadata.channel}-${metadata.revision}.manifest.json`
}

export function manifestUrl(metadata) {
  return `https://github.com/${repository}/releases/download/${metadata.tag}/${manifestName(metadata)}`
}

export function inventoryDigest(files) {
  return sha256(files.map(file => `${file.path}:${file.sha256}`).join('\n'))
}

function assertFilePath(value) {
  assert.ok(typeof value === 'string' && value.length > 0 && !value.includes('\\') && !value.includes('\0'))
  assert.ok(!path.posix.isAbsolute(value) && !value.split('/').some(part => part === '..' || part === '.' || part === ''))
  assert.equal(path.posix.normalize(value), value, 'Output paths must be canonical relative paths')
}

export async function outputInventory(directory, excluded = new Set()) {
  const files = []
  const visit = async relative => {
    const file = path.join(directory, relative)
    const stat = await lstat(file)
    assert.ok(!stat.isSymbolicLink(), `Output symlinks are forbidden: ${relative}`)
    if (stat.isDirectory()) {
      for (const name of (await readdir(file)).sort()) await visit(relative ? `${relative}/${name}` : name)
    } else {
      assert.ok(stat.isFile(), `Output must contain regular files: ${relative}`)
      assertFilePath(relative)
      if (excluded.has(relative)) return
      assert.ok(stat.size <= 25 * 1024 ** 2, `Pages file exceeds 25 MiB: ${relative}`)
      files.push({ path: relative, size: stat.size, sha256: sha256(await readFile(file)) })
    }
  }
  await visit('')
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
  assert.ok(files.length > 0 && files.length <= 100_000, 'A bounded, nonempty output inventory is required')
  return files
}

function assertLegacyDesignAssets(files, metadata) {
  const paths = new Set(files.map(file => file.path))
  for (const file of ['_worker.js', '_routes.json']) {
    assert.equal(paths.has(file), metadata.legacyDesignCutover, `${file} presence differs from the legacy design cutover`)
  }
}

function identityBytes(metadata, payloadDigest) {
  // This descriptor does not contain its own hash or the enclosing manifest hash.
  return jsonBytes({ schemaVersion: 1, ...metadata, payloadDigest })
}

export async function prepareIdentity(directory, input) {
  const metadata = releaseMetadata(input)
  const payload = await outputInventory(directory, new Set([identityPath]))
  assert.ok(payload.some(file => file.path.endsWith('.html')), 'Production HTML is required')
  assertLegacyDesignAssets(payload, metadata)
  const target = path.join(directory, identityPath)
  // Inventory rejects a preexisting symlink, including at the reserved path.
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, identityBytes(metadata, inventoryDigest(payload)))
  return metadata
}

export function validateRegistryEvidence(registry, metadata) {
  assert.equal(registry?.url, 'https://registry.npmjs.org/')
  assert.equal(registry.channel, metadata.channel === 'main' ? 'latest' : 'rc')
  assert.ok(Array.isArray(registry.packages) && registry.packages.length > 0)
  const names = registry.packages.map(pkg => pkg.name)
  assert.deepEqual(names, [...new Set(names)].sort(), 'Registry cohort must be complete, unique and sorted')
  for (const pkg of registry.packages) {
    assert.match(pkg.name ?? '', /^@master\/[a-z0-9-]+$/)
    assert.equal(pkg.version, metadata.version)
    assert.match(pkg.integrity ?? '', /^sha512-[A-Za-z0-9+/]+={0,2}$/)
    assert.equal(typeof pkg.provenance, 'boolean')
    assert.deepEqual(Object.keys(pkg).sort(), ['name', 'version', 'integrity', 'provenance'].sort())
  }
  assert.deepEqual(Object.keys(registry).sort(), ['url', 'channel', 'packages'].sort())
}

export function validateManifest(value, expected) {
  assert.equal(value?.schemaVersion, 1, 'Unsupported site manifest schema')
  const metadata = releaseMetadata(value)
  if (expected) assert.deepEqual(metadata, releaseMetadata(expected), 'Site manifest release identity differs')
  assert.deepEqual(Object.keys(value).sort(), ['schemaVersion', ...metadataKeys, 'files', 'buildDigest', 'verification', 'registry'].sort())
  validateRegistryEvidence(value.registry, metadata)
  assert.ok(Array.isArray(value.files) && value.files.length > 0 && value.files.length <= 100_000)
  for (const file of value.files) {
    assert.deepEqual(Object.keys(file).sort(), ['path', 'sha256', 'size'])
    assertFilePath(file.path)
    assert.ok(Number.isSafeInteger(file.size) && file.size >= 0 && file.size <= 25 * 1024 ** 2)
    assert.match(file.sha256 ?? '', /^[a-f0-9]{64}$/)
  }
  assertLegacyDesignAssets(value.files, metadata)
  const paths = value.files.map(file => file.path)
  assert.deepEqual(paths, [...new Set(paths)].sort(), 'Manifest paths must be unique and sorted')
  assert.ok(paths.includes(identityPath) && paths.some(file => file.endsWith('.html')))
  assert.equal(value.buildDigest, inventoryDigest(value.files), 'Manifest output digest differs')
  assert.deepEqual(Object.keys(value.verification ?? {}).sort(), ['reportSha256', 'pages', 'localLinks', 'profilesByEngine', 'failures', 'sourceStatus'].sort())
  assert.match(value.verification?.reportSha256 ?? '', /^[a-f0-9]{64}$/)
  assert.equal(value.verification?.failures, 0)
  assert.ok(Number.isSafeInteger(value.verification?.pages) && value.verification.pages > 0)
  assert.ok(Number.isSafeInteger(value.verification?.localLinks) && value.verification.localLinks > 0)
  assert.deepEqual(Object.keys(value.verification?.profilesByEngine ?? {}).sort(), ['chromium', 'firefox', 'webkit'])
  for (const count of Object.values(value.verification.profilesByEngine)) assert.ok(Number.isSafeInteger(count) && count > 0)
  assert.ok(Array.isArray(value.verification.sourceStatus))
  for (const line of value.verification.sourceStatus) assert.equal(line, '?? site/.cache/', 'Release proof contains an unexpected source change')
  return metadata
}

export async function verifyOutput(directory, manifest, expected) {
  const metadata = validateManifest(manifest, expected)
  const files = await outputInventory(directory)
  assert.deepEqual(files, manifest.files, 'Cloudflare output differs from the browser-verified release output')
  const payload = files.filter(file => file.path !== identityPath)
  assert.ok((await readFile(path.join(directory, identityPath))).equals(identityBytes(metadata, inventoryDigest(payload))), 'Public site identity differs')
  return { revision: metadata.revision, version: metadata.version, files: files.length, buildDigest: inventoryDigest(files) }
}

/**
 * Whether a browser report proves these exact final bytes for this delivery: its revision and
 * origin, no failures, every engine, a clean source tree, and a digest that covers the public
 * identity of this metadata. Validation proves a site-only delivery this way before release.
 */
export async function checkVerifiedOutput(directory, input, reportBytes) {
  const metadata = releaseMetadata(input)
  const report = JSON.parse(reportBytes)
  assert.equal(report.revision, metadata.revision)
  assert.equal(report.origin, metadata.origin)
  assert.deepEqual(report.failures, [], 'Browser verification must succeed before publishing its manifest')
  const files = await outputInventory(directory)
  assertLegacyDesignAssets(files, metadata)
  assert.equal(report.buildDigest, inventoryDigest(files), 'Browser proof must cover the final output including its public identity')
  const payload = files.filter(file => file.path !== identityPath)
  assert.ok((await readFile(path.join(directory, identityPath))).equals(identityBytes(metadata, inventoryDigest(payload))), 'Public site identity differs from this delivery')
  assert.deepEqual([...new Set((report.profiles ?? []).map(profile => profile.engine))].sort(), ['chromium', 'firefox', 'webkit'], 'Browser proof must cover every engine')
  assert.ok(Array.isArray(report.sourceStatus) && report.sourceStatus.every(line => line === '?? site/.cache/'), 'Release proof contains an unexpected source change')
  return { metadata, report, files }
}

export async function createManifest(directory, input, reportBytes, registry) {
  const { metadata, report, files } = await checkVerifiedOutput(directory, input, reportBytes)
  const profilesByEngine = {}
  for (const profile of report.profiles ?? []) profilesByEngine[profile.engine] = (profilesByEngine[profile.engine] ?? 0) + 1
  const manifest = { schemaVersion: 1, ...metadata, registry, files, buildDigest: inventoryDigest(files), verification: {
    reportSha256: sha256(reportBytes), pages: report.pages, localLinks: report.localLinks,
    profilesByEngine, failures: report.failures.length, sourceStatus: report.sourceStatus
  } }
  await verifyOutput(directory, manifest, metadata)
  return manifest
}
