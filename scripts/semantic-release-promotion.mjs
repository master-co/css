import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { execa } from 'execa'
import { getChannel, readPackage } from '@aronrepo/semantic-release-pnpm'
import { assertNpmOidcEnvironment, createNpmOidcSession, npmRegistry } from './npm-oidc.mjs'
import { verifyRegistryConsumer } from './release-registry-consumer.mjs'
import { assertReleaseProvenanceProof, verifyReleaseProvenance } from './release-registry-provenance.mjs'
// semantic-release writes channel Git notes before addChannel. Use the installed
// release selector in verifyConditions to block that path before those writes.
import getReleaseToAdd from 'semantic-release/lib/get-release-to-add.js'

const digest = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`
const statePath = context => resolve(context.cwd ?? process.cwd(), context.env?.MASTER_CSS_RELEASE_STATE ?? 'release-artifacts/promotion-state.json')
const revision = context => context.nextRelease.gitHead ?? context.env?.GITHUB_SHA
const runIdentity = context => `${context.env?.GITHUB_RUN_ID ?? 'local'}:${context.env?.GITHUB_RUN_ATTEMPT ?? '1'}`
export const candidateTag = version => `candidate-${version}`

export function assertReleaseFlag(context, name) {
  assertNpmOidcEnvironment(context.env)
  assert.equal(context.env?.[name], '1', `Set ${name}=1 only in the authorized release workflow`)
}

async function save(context, state) {
  const file = statePath(context)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(`${file}.tmp`, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 })
  await rename(`${file}.tmp`, file)
}

async function load(context) {
  try { return JSON.parse(await readFile(statePath(context), 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const registryRetryDelays = [1000, 2000, 4000, 8000, 15_000]
const tagRetryDelays = [...registryRetryDelays, 20_000, 25_000, 30_000]
// npm scans new versions after accepting an upload. Scan time can exceed 15 minutes.
const publicationRetryDelays = [...tagRetryDelays, ...Array(23).fill(45_000)]
const installMetadataMediaType = 'application/vnd.npm.install-v1+json'
const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

function registryPackagePath(name) {
  assert.match(name, /^(?:@[a-z0-9][a-z0-9_.-]*\/)?[a-z0-9][a-z0-9_.-]*$/i, 'Expected an npm package name')
  // Match npm-package-arg's escapedName, which npm uses for its registry routes.
  return name.replace('/', '%2f')
}

function versionPath(name, version) {
  assert.match(version, exactVersion, 'Expected an exact npm version')
  return `${registryPackagePath(name)}/${encodeURIComponent(version)}`
}

const distTagsPath = name => `-/package/${registryPackagePath(name)}/dist-tags`

async function readRegistry(path, fetchMetadata, wait, inspect, delays = registryRetryDelays, accept = 'application/json') {
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const retry = attempt < delays.length
    let response, body
    try {
      response = await fetchMetadata(`${npmRegistry}${path}`, {
        headers: { accept, 'cache-control': 'no-cache' }, redirect: 'error', signal: AbortSignal.timeout(15_000)
      })
      if (response.ok) body = await response.json()
    } catch (error) {
      if (!retry || error instanceof SyntaxError) throw error
      response = undefined
    }
    if (response && (!retry || (response.status !== 429 && response.status < 500))) {
      assert.ok(response.ok || response.status === 404, `Registry request failed for ${path}: ${response.status}`)
      if (response.ok) assert.ok(body && typeof body === 'object' && !Array.isArray(body), `Invalid registry document for ${path}`)
      const value = inspect(response.status === 404 ? null : body, retry)
      if (value !== undefined) return value
    }
    if (retry) await wait(delays[attempt])
  }
  throw new Error(`Registry read exhausted for ${path}`)
}

function validateRegistryVersion(published, name, version) {
  assert.equal(published.name, name, `Registry package name differs: ${name}`)
  assert.equal(published.version, version, `Registry version differs: ${name}`)
}

export async function readRegistryVersion(name, version, fetchMetadata = fetch, wait = pause) {
  return readRegistry(versionPath(name, version), fetchMetadata, wait, published => {
    if (published !== null) validateRegistryVersion(published, name, version)
    return published
  })
}

function validateRegistryTags(tags, name) {
  assert.ok(tags, `Registry dist-tags unavailable for ${name}`)
  const values = { ...tags }
  delete values._etag // Match the metadata removal in npm dist-tag.
  assert.ok(Object.values(values).every(tag => typeof tag === 'string' && exactVersion.test(tag)),
    `Registry dist-tags unavailable for ${name}`)
  return values
}

export async function readRegistryTags(name, fetchMetadata = fetch, wait = pause) {
  return readRegistry(distTagsPath(name), fetchMetadata, wait, tags => validateRegistryTags(tags, name))
}

async function confirmRegistryTag(name, channel, version, baseline, fetchMetadata, wait) {
  return readRegistry(distTagsPath(name), fetchMetadata, wait, (tags, retry) => {
    const tag = validateRegistryTags(tags, name)[channel] ?? null
    if (retry && tag === baseline && tag !== version) return undefined
    assert.equal(tag, version, `Formal tag verification failed: ${name}@${channel}`)
    return tag
  }, tagRetryDelays)
}

async function confirmCandidateTags(name, candidate, version, before, fetchMetadata) {
  const { [candidate]: previousCandidate, ...baseline } = before
  return readRegistry(distTagsPath(name), fetchMetadata, pause, (tags, retry) => {
    const { [candidate]: observedCandidate, ...observed } = validateRegistryTags(tags, name)
    assert.deepEqual(observed, baseline, `Non-candidate registry tags changed while staging ${name}`)
    if (retry && observedCandidate === previousCandidate && observedCandidate !== version) return undefined
    assert.equal(observedCandidate, version, `Candidate tag verification failed: ${name}@${candidate}`)
    return observedCandidate
  }, publicationRetryDelays)
}

function assertIdentity(state, context) {
  assert.equal(state.schemaVersion, 1, 'Unsupported release state')
  assert.equal(state.version, context.nextRelease.version, 'Archived release state version differs')
  assert.equal(state.candidateTag, candidateTag(state.version), 'Archived state must use the candidate-only tag')
  assert.match(state.revision, /^[a-f0-9]{40}$/)
  assert.equal(state.revision, revision(context), 'Archived release state revision differs')
  if (state.run !== runIdentity(context)) {
    assert.equal(context.env?.MASTER_CSS_RELEASE_RECOVERY, '1', 'A previous run owns this release state; explicit recovery is required')
  }
}

async function cohort(config, context) {
  assert.ok(config.workspaceRoots?.length, 'Release must declare the complete workspace cohort')
  const result = []
  for (const root of config.workspaceRoots) {
    const pkg = await readPackage(context.cwd ?? process.cwd(), root)
    if (!pkg.private) result.push({ root, pkg })
  }
  assert.equal(new Set(result.map(entry => entry.pkg.name)).size, result.length, 'Duplicate release package')
  return result.sort((a, b) => a.pkg.name.localeCompare(b.pkg.name))
}

async function assertCohort(state, config, context, verifyArchives) {
  const entries = await cohort(config, context)
  assert.deepEqual(state.packages.map(pkg => pkg.name).sort(), entries.map(entry => entry.pkg.name), 'Archived release package cohort differs')
  if (verifyArchives) for (const pkg of state.packages) {
    const source = entries.find(entry => entry.pkg.name === pkg.name).pkg
    assert.equal(pkg.provenance, source.publishConfig?.provenance === true, `Archived provenance requirement differs: ${pkg.name}`)
    assert.equal(digest(await readFile(resolve(dirname(statePath(context)), pkg.archive))), pkg.integrity, `Candidate archive changed: ${pkg.name}`)
  }
}

export async function recoveryArchive(config, context, name) {
  if (context.env?.MASTER_CSS_RELEASE_RECOVERY !== '1') return null
  const state = await load(context)
  assert.ok(state, 'Recovery requires the archived release state and archives')
  assertIdentity(state, context)
  await assertCohort(state, config, context, true)
  const item = state.packages.find(pkg => pkg.name === name)
  assert.ok(item, `Recovery package is outside the archived cohort: ${name}`)
  return resolve(dirname(statePath(context)), item.archive)
}

function validatePublishedArchive(pkg, published) {
  assert.equal(published.dist?.integrity, pkg.integrity, `Immutable registry integrity differs: ${pkg.name}; choose a new version and rebuild`)
  if (pkg.gitHead !== undefined) assert.equal(published.gitHead, pkg.gitHead, `Registry source differs: ${pkg.name}`)
}

export async function readPublishedPackage(pkg, version, fetchMetadata = fetch, wait = pause) {
  return readRegistry(versionPath(pkg.name, version), fetchMetadata, wait, (published, retry) => {
    if (published === null && retry) return undefined
    assert.ok(published, `Candidate version missing: ${pkg.name}@${version}`)
    validateRegistryVersion(published, pkg.name, version)
    validatePublishedArchive(pkg, published)
    if (pkg.provenance && !published.dist?.attestations?.url) {
      if (retry) return undefined
      assert.fail(`Registry provenance is missing: ${pkg.name}`)
    }
    return published
  }, publicationRetryDelays)
}

export async function readInstallableVersion(pkg, version, fetchMetadata = fetch, wait = pause) {
  return readRegistry(registryPackagePath(pkg.name), fetchMetadata, wait, (packument, retry) => {
    if (packument !== null) assert.equal(packument.name, pkg.name, `Registry package name differs: ${pkg.name}`)
    const published = packument?.versions?.[version]
    if (!published && retry) return undefined
    assert.ok(published, `Candidate missing from npm install metadata: ${pkg.name}@${version}`)
    validateRegistryVersion(published, pkg.name, version)
    // Abbreviated install metadata does not include gitHead or attestations.
    validatePublishedArchive({ name: pkg.name, integrity: pkg.integrity }, published)
    return published
  }, publicationRetryDelays, installMetadataMediaType)
}

/** Baselines are saved before the first write. Recovery requires this archived state. */
async function initialize(config, context, fetchMetadata) {
  let state = await load(context)
  if (state) {
    assertIdentity(state, context)
    await assertCohort(state, config, context, true)
    await initializeChannel(state, getChannel(context.nextRelease.channel), context, fetchMetadata)
    return state
  }
  assert.notEqual(context.env?.MASTER_CSS_RELEASE_RECOVERY, '1', 'Recovery requires the archived release state; never reconstruct its original tags')
  const version = context.nextRelease.version
  assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
  assert.match(revision(context), /^[a-f0-9]{40}$/)
  const channel = getChannel(context.nextRelease.channel)
  const packages = []
  const { packedManifest, validatePackedArchive } = await import('./semantic-release-workspace.mjs')
  const entries = await cohort(config, context)
  const names = new Set(entries.map(entry => entry.pkg.name))
  for (const { pkg } of entries) {
    const archivePath = resolve(context.cwd ?? process.cwd(), config.tarballDir ?? 'release-artifacts/packages', `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`)
    const archive = relative(dirname(statePath(context)), archivePath)
    const bytes = await readFile(archivePath)
    validatePackedArchive(bytes, pkg.name, version, revision(context))
    const packed = packedManifest(bytes)
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [name, dependency] of Object.entries(packed[field] ?? {})) {
        if (names.has(name)) assert.equal(dependency, version, `Candidate must pin its complete dependency cohort: ${pkg.name} -> ${name}`)
      }
    }
    assert.equal(await readRegistryVersion(pkg.name, version, fetchMetadata), null,
      `Version already exists: ${pkg.name}@${version}; recover with archived state or choose a new version`)
    packages.push({ name: pkg.name, archive, integrity: digest(bytes), provenance: pkg.publishConfig?.provenance === true,
      staged: false, attempt: null })
  }
  state = { schemaVersion: 1, version, revision: revision(context), run: runIdentity(context), candidateTag: candidateTag(version), packages, channels: {}, events: [] }
  await save(context, state)
  await initializeChannel(state, channel, context, fetchMetadata)
  return state
}

async function initializeChannel(state, channel, context, fetchMetadata) {
  if (state.channels[channel]) return
  const baseline = {}
  for (const pkg of state.packages) {
    baseline[pkg.name] = (await readRegistryTags(pkg.name, fetchMetadata))[channel] ?? null
  }
  state.channels[channel] = { baseline, promoted: [], pending: null, complete: false }
  await save(context, state)
}

export async function stagePackage(config, context, pkg, archive, executeNpm, fetchMetadata = fetch) {
  assertReleaseFlag(context, 'MASTER_CSS_RELEASE_STAGE')
  const state = await initialize(config, context, fetchMetadata)
  const item = state.packages.find(entry => entry.name === pkg.name)
  assert.ok(item, 'Package is outside the release cohort')
  const bytes = await readFile(archive)
  assert.equal(digest(bytes), item.integrity, 'Prepared archive differs from release state')
  const { validatePackedArchive } = await import('./semantic-release-workspace.mjs')
  validatePackedArchive(bytes, pkg.name, state.version, state.revision)
  const expected = { ...item, gitHead: state.revision }
  const existing = await readRegistryVersion(pkg.name, state.version, fetchMetadata)
  if (existing) {
    assert.equal(context.env?.MASTER_CSS_RELEASE_RECOVERY, '1', `Candidate already exists: ${pkg.name}; explicit recovery is required`)
    assert.ok(item.attempt, 'Archived state has no upload attempt for this existing version')
    validatePublishedArchive(expected, existing)
    if (item.provenance && !existing.dist?.attestations?.url) await readPublishedPackage(expected, state.version, fetchMetadata)
    if (!item.staged) {
      assert.ok(item.tagsBefore, `Archived upload has no pre-write registry tags: ${pkg.name}`)
      await confirmCandidateTags(pkg.name, state.candidateTag, state.version, item.tagsBefore, fetchMetadata)
    }
    await readInstallableVersion(expected, state.version, fetchMetadata)
    item.staged = true
    state.events.push({ operation: 'verify-existing', name: pkg.name, at: new Date().toISOString() })
    await save(context, state)
    return state.candidateTag
  }
  assert.equal(item.staged, false, `Previously staged candidate disappeared: ${pkg.name}`)
  const tagsBefore = await readRegistryTags(pkg.name, fetchMetadata)
  const channel = getChannel(context.nextRelease.channel)
  assert.equal(tagsBefore[channel] ?? null, state.channels[channel].baseline[pkg.name],
    `Formal tag changed outside this release: ${pkg.name}@${channel}; stop and reconcile`)
  assert.equal(tagsBefore[state.candidateTag], undefined,
    `Candidate tag already exists for ${pkg.name} but its exact version is unavailable; stop and reconcile`)
  assert.ok(!Object.values(tagsBefore).includes(state.version),
    `Registry tag already points to ${pkg.name}@${state.version} but its exact version is unavailable; stop and reconcile`)
  if (item.tagsBefore) assert.deepEqual(tagsBefore, item.tagsBefore, `Registry tags changed after the previous upload attempt: ${pkg.name}`)
  assert.equal(item.attempt, null, `Previous npm upload of ${pkg.name} is unresolved; do not submit it again while its exact version is unavailable`)
  item.tagsBefore = tagsBefore
  item.attempt = new Date().toISOString()
  item.uploadRun = runIdentity(context)
  item.uploadEvent = context.env?.GITHUB_EVENT_NAME ?? null
  state.events.push({ operation: 'upload-start', name: pkg.name, at: item.attempt, run: item.uploadRun, event: item.uploadEvent })
  await save(context, state)
  const args = ['publish', archive, '--tag', state.candidateTag, '--ignore-scripts', '--fetch-retries=0']
  if (pkg.publishConfig?.provenance) args.push('--provenance')
  await executeNpm(pkg, args, context)
  await confirmCandidateTags(pkg.name, state.candidateTag, state.version, tagsBefore, fetchMetadata)
  await Promise.all([readPublishedPackage(expected, state.version, fetchMetadata), readInstallableVersion(expected, state.version, fetchMetadata)])
  item.staged = true
  state.events.push({ operation: 'upload-verified', name: pkg.name, at: new Date().toISOString() })
  await save(context, state)
  return state.candidateTag
}

export function createReleasePromotion({ run = execa, fetchMetadata = fetch, consumerProbe = verifyRegistryConsumer,
  provenanceProbe = verifyReleaseProvenance, wait = pause } = {}) {
  async function verifyConditions(_config, context) {
    assertReleaseFlag(context, 'MASTER_CSS_RELEASE_PROMOTE')
    if (context.branch && getReleaseToAdd(context)) {
      throw new Error('Automatic addChannel is disabled before semantic-release writes Git notes; use the explicit archived-state recovery entrypoint')
    }
  }
  async function verifyRelease(config, context) {
    // semantic-release creates its Git tag before publish. Reject known immutable
    // collisions before that point; interrupted releases use release-recover.
    assertReleaseFlag(context, 'MASTER_CSS_RELEASE_STAGE')
    assertReleaseFlag(context, 'MASTER_CSS_RELEASE_PROMOTE')
    assert.notEqual(context.env?.MASTER_CSS_RELEASE_RECOVERY, '1', 'Use release-recover.mjs instead of semantic-release for recovery')
    const { version } = context.nextRelease
    for (const { pkg } of await cohort(config, context)) {
      assert.equal(pkg.publishConfig?.provenance, true, `Formal release requires signed npm provenance: ${pkg.name}`)
      assert.equal(await readRegistryVersion(pkg.name, version, fetchMetadata, wait), null,
        `Version already exists before Git tagging: ${pkg.name}; use archived-state recovery or a new version`)
      const tags = await readRegistryTags(pkg.name, fetchMetadata, wait)
      assert.ok(!Object.values(tags).includes(version), `Registry tag already points to ${pkg.name}@${version} before Git tagging`)
    }
  }
  async function promote(config, context) {
    assertReleaseFlag(context, 'MASTER_CSS_RELEASE_PROMOTE')
    const state = await load(context)
    assert.ok(state, 'Promotion/addChannel requires the archived release state and its original checksums')
    assertIdentity(state, context)
    await assertCohort(state, config, context, true)
    const channel = getChannel(context.nextRelease.channel)
    // Complete-cohort registry verification must precede every formal tag write.
    const manifests = []
    for (const pkg of state.packages) manifests.push(await readPublishedPackage({ ...pkg, gitHead: state.revision }, state.version, fetchMetadata, wait))
    // The internal site snapshot channel is separate from formal product releases.
    if (channel !== 'site') {
      assert.ok(state.packages.every(pkg => pkg.provenance), 'Every formal release archive requires signed npm provenance')
      state.provenanceProof = await provenanceProbe({ state, context, manifests, fetchMetadata, run })
      assertReleaseProvenanceProof(state)
      await save(context, state)
    }
    // Run against actual public registry versions in an isolated host consumer.
    // A failed install, wrong lock identity or failed native/Wasm/CLI/PHP smoke
    // aborts before any formal tag write, including during recovery/addChannel.
    state.consumerProof = await consumerProbe(state, context)
    assert.equal(state.consumerProof.version, state.version, 'Consumer proof version differs')
    assert.equal(state.consumerProof.revision, state.revision, 'Consumer proof revision differs')
    await save(context, state)
    await initializeChannel(state, channel, context, fetchMetadata)
    const promotion = state.channels[channel]
    for (const pkg of state.packages) {
      const tag = (await readRegistryTags(pkg.name, fetchMetadata, wait))[channel] ?? null
      const completed = promotion.promoted.includes(pkg.name)
      if (tag === state.version && (completed || promotion.pending === pkg.name)) {
        if (!completed) promotion.promoted.push(pkg.name)
        if (promotion.pending === pkg.name) promotion.pending = null
        await save(context, state)
        continue
      }
      assert.equal(tag, promotion.baseline[pkg.name], `Formal tag changed outside this release: ${pkg.name}@${channel}; stop and reconcile`)
      assert.equal(completed, false, `Previously promoted tag was moved: ${pkg.name}@${channel}`)
      promotion.pending = pkg.name
      state.events.push({ operation: 'promotion-start', name: pkg.name, channel, at: new Date().toISOString() })
      await save(context, state)
      const session = await createNpmOidcSession(context.env)
      try {
        const { cleanup, ...options } = session
        await run('npm', ['dist-tag', 'add', `${pkg.name}@${state.version}`, channel, '--registry', npmRegistry, '--fetch-retries=0'], options)
      } finally { await session.cleanup() }
      await confirmRegistryTag(pkg.name, channel, state.version, promotion.baseline[pkg.name], fetchMetadata, wait)
      promotion.promoted.push(pkg.name)
      promotion.pending = null
      state.events.push({ operation: 'promotion-verified', name: pkg.name, channel, at: new Date().toISOString() })
      await save(context, state)
    }
    promotion.complete = true
    await save(context, state)
    return { name: `Verified npm cohort (@${channel})`, channel }
  }
  return { verifyConditions, verifyRelease, publish: promote, addChannel: promote }
}

const promotion = createReleasePromotion()
export const { verifyConditions, verifyRelease, publish, addChannel } = promotion
