import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { channels, checkVerifiedOutput, createManifest, jsonBytes, manifestName, manifestUrl, prepareIdentity, releaseMetadata, repository, sha256, validateManifest, validateRegistryEvidence, verifyOutput } from './pages-site-manifest.mjs'
import { advancePointer, downloadManifest, publishManifest, verifyLiveIdentity, waitForPages } from './pages-release-github.mjs'

const git = args => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 30_000 }).trim()
const remote = `https://github.com/${repository}.git`
const manifestFile = 'release-artifacts/site.manifest.json'

const tagPatterns = { main: /^v(\d+)\.(\d+)\.(\d+)$/, rc: /^v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$/ }

function tagTargets(refs) {
  const tags = new Map()
  for (const line of refs.trim().split('\n')) {
    const match = line.match(/^([a-f0-9]{40})\trefs\/tags\/(v[^\s]+?)(\^\{\})?$/)
    if (!match) continue
    const previous = tags.get(match[2]) ?? {}
    tags.set(match[2], { ...previous, [match[3] ? 'peeled' : 'object']: match[1] })
  }
  return new Map([...tags].map(([tag, target]) => [tag, target.peeled ?? target.object]))
}

/** The highest release tag of a channel, compared numerically. */
export function newestTag(tags, channel) {
  const pattern = tagPatterns[channel]
  assert.ok(pattern, 'Only main and rc can deliver the site')
  const parts = tag => tag.match(pattern).slice(1).map(Number)
  return tags.filter(tag => pattern.test(tag)).sort((a, b) => {
    const [x, y] = [parts(a), parts(b)]
    return x.map((value, index) => y[index] - value).find(Boolean) ?? 0
  })[0]
}

export function selectExactTag(refs, revision, channel) {
  const matches = [...tagTargets(refs)].filter(([tag, target]) => tagPatterns[channel]?.test(tag) && target === revision)
  assert.equal(matches.length, 1, 'Require exactly one actual release tag on this exact source commit; never use the latest remote tag')
  return matches[0][0]
}

/**
 * The release a Pages source documents: the release tagged on that exact commit, or for a
 * site-only commit the channel's newest release, whose published manifest names this commit.
 */
export function selectReleaseTag(refs, revision, channel) {
  const targets = tagTargets(refs)
  const exact = [...targets].filter(([tag, target]) => tagPatterns[channel]?.test(tag) && target === revision)
  assert.ok(exact.length <= 1, 'Require at most one actual release tag on this exact source commit')
  if (exact.length) return { tag: exact[0][0], releaseRevision: revision }
  const tag = newestTag([...targets.keys()], channel)
  assert.ok(tag, 'A published release on this channel is required')
  return { tag, releaseRevision: targets.get(tag) }
}

/**
 * Decides whether a push delivers the site. A release delivers with its own version. Without
 * one, the site still delivers when no release path changed since the channel's newest
 * release: its workspace packages are then exactly what users install. Otherwise the site
 * waits for the release of those changes, so it never documents unpublished behavior.
 */
export function planDelivery({ released, version, channel, reachableTags, releasePathChanges }) {
  if (released) {
    assert.match(version ?? '', /^\d+\.\d+\.\d+(-rc\.\d+)?$/, 'A release delivers with its actual version')
    return { deliver: true, kind: 'release', version }
  }
  const tag = newestTag(reachableTags, channel)
  if (!tag) return { deliver: false, reason: `No ${channel} release precedes this commit.` }
  const changes = releasePathChanges(tag)
  if (changes.length) {
    const listed = changes.slice(0, 10).join(', ') + (changes.length > 10 ? `, and ${changes.length - 10} more` : '')
    return { deliver: false, reason: `Unreleased package changes since ${tag} (${listed}); the site deploys with their release.` }
  }
  return { deliver: true, kind: 'site', version: tag.slice(1) }
}

export function ciMetadata(env = process.env, runGit = git) {
  assert.equal(env.GITHUB_REPOSITORY, repository)
  assert.equal(env.GITHUB_EVENT_NAME, 'push', 'Site delivery belongs to a push of its channel branch')
  assert.equal(runGit(['rev-parse', 'HEAD']), env.GITHUB_SHA, 'Checkout differs from the site source')
  assert.ok(['release', 'site'].includes(env.SITE_DELIVERY), 'Plan the delivery before building the site')
  const channel = env.GITHUB_REF_NAME
  const tag = `v${env.PUBLIC_VERSION}`
  const releaseRevision = runGit(['rev-parse', '--verify', `refs/tags/${tag}^{commit}`])
  const metadata = releaseMetadata({ repository, revision: env.GITHUB_SHA, releaseRevision, version: env.PUBLIC_VERSION,
    tag, channel, deliveryBranch: channels[channel]?.deliveryBranch,
    project: env.PAGES_PROJECT, subdomain: env.PAGES_SUBDOMAIN, origin: env.PUBLIC_URL, imageTransformations: false })
  assert.equal(env.PUBLIC_COMMIT_REF, channel)
  assert.equal(env.MASTER_CSS_IMAGE_TRANSFORMATIONS, 'false')
  assert.ok(['bootstrap', 'production'].includes(env.PAGES_RELEASE_MODE), 'Choose an explicit bootstrap or production delivery mode')
  if (env.SITE_DELIVERY === 'release') assert.equal(releaseRevision, metadata.revision, 'Actual release tag differs from this source')
  else assert.notEqual(releaseRevision, metadata.revision, 'A tagged release commit delivers through its release')
  return metadata
}

export function hostedMetadata(env = process.env, runGit = git) {
  assert.equal(env.CF_PAGES, '1', 'This command is exclusively the verified Pages Git release build')
  const channel = Object.keys(channels).find(name => channels[name].deliveryBranch === env.CF_PAGES_BRANCH)
  assert.ok(channel, 'Pages must build a release-success delivery branch')
  assert.match(env.CF_PAGES_COMMIT_SHA ?? '', /^[a-f0-9]{40}$/)
  assert.equal(runGit(['rev-parse', 'HEAD']), env.CF_PAGES_COMMIT_SHA, 'Cloudflare source identity differs')
  const { tag, releaseRevision } = selectReleaseTag(runGit(['ls-remote', '--tags', remote, 'v*']), env.CF_PAGES_COMMIT_SHA, channel)
  const metadata = releaseMetadata({ repository, revision: env.CF_PAGES_COMMIT_SHA, releaseRevision, version: tag.slice(1), tag, channel,
    deliveryBranch: env.CF_PAGES_BRANCH, project: env.MASTER_CSS_PAGES_PROJECT,
    subdomain: env.MASTER_CSS_PAGES_SUBDOMAIN, origin: channels[channel].origin, imageTransformations: false })
  for (const [name, expected] of Object.entries({ PUBLIC_COMMIT_REF: channel, PUBLIC_VERSION: metadata.version,
    PUBLIC_URL: metadata.origin, MASTER_CSS_IMAGE_TRANSFORMATIONS: 'false' })) {
    if (env[name] !== undefined) assert.equal(env[name], expected, `Configured ${name} differs from the actual release`)
  }
  const url = new URL(env.CF_PAGES_URL)
  assert.equal(url.protocol, 'https:')
  assert.ok(!url.username && !url.password && !url.port && url.pathname === '/' && !url.search && !url.hash)
  const prefix = url.hostname.slice(0, -(metadata.subdomain.length + 1))
  assert.equal(url.hostname, `${prefix}.${metadata.subdomain}`, 'Cloudflare is building a different Pages project subdomain')
  assert.match(prefix, /^[a-f0-9]{8}$/, 'An immutable Pages deployment URL is required')
  return metadata
}

async function publicCohort(root = '.') {
  const names = []
  for (const directory of await readdir(path.join(root, 'packages'), { withFileTypes: true })) {
    if (!directory.isDirectory()) continue
    let pkg
    try { pkg = JSON.parse(await readFile(path.join(root, 'packages', directory.name, 'package.json'), 'utf8')) } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    if (!pkg.private) names.push(pkg.name)
  }
  return names.sort()
}

export function registryFromState(state, metadata, names) {
  assert.equal(state.schemaVersion, 1)
  assert.equal(state.revision, metadata.releaseRevision)
  assert.equal(state.version, metadata.version)
  const channel = metadata.channel === 'main' ? 'latest' : 'rc'
  assert.equal(state.channels?.[channel]?.complete, true, 'The whole public cohort must be promoted first')
  assert.deepEqual([...state.channels[channel].promoted].sort(), names)
  assert.equal(state.consumerProof?.revision, metadata.releaseRevision)
  assert.equal(state.consumerProof?.version, metadata.version)
  assert.equal(state.consumerProof?.smoke?.native, 'native')
  for (const key of ['nativeWasmParity', 'stackedConditions', 'publicPHPSource', 'cliHelp']) assert.equal(state.consumerProof?.smoke?.[key], true)
  const registry = { url: 'https://registry.npmjs.org/', channel, packages: state.packages.map(pkg => ({
    name: pkg.name, version: state.version, integrity: pkg.integrity, provenance: pkg.provenance
  })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0) }
  validateRegistryEvidence(registry, metadata)
  assert.deepEqual(registry.packages.map(pkg => pkg.name), names, 'Site release must retain the complete public source cohort')
  return registry
}

export async function verifyPublicRegistry(registry, metadata, fetchApi = fetch) {
  validateRegistryEvidence(registry, metadata)
  for (let offset = 0; offset < registry.packages.length; offset += 6) {
    await Promise.all(registry.packages.slice(offset, offset + 6).map(async pkg => {
      const response = await fetchApi(`${registry.url}${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}`, {
        headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(15_000)
      })
      assert.equal(response.status, 200, `Published registry version is unavailable: ${pkg.name}`)
      const value = await response.json()
      assert.equal(value.name, pkg.name)
      assert.equal(value.version, metadata.version)
      assert.equal(value.gitHead, metadata.releaseRevision, `Published package source differs: ${pkg.name}`)
      assert.equal(value.dist?.integrity, pkg.integrity, `Published archive differs: ${pkg.name}`)
      if (pkg.provenance) assert.ok(value.dist?.attestations?.url, `Published provenance is missing: ${pkg.name}`)
    }))
  }
}

/**
 * Registry evidence for a site-only delivery, read from npm itself: every public package of
 * the documented release, built from its tagged source and still the channel's dist-tag.
 */
export async function registryFromNpm(metadata, names, fetchApi = fetch) {
  const url = 'https://registry.npmjs.org/'
  const channel = metadata.channel === 'main' ? 'latest' : 'rc'
  const read = async address => {
    const response = await fetchApi(address, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(15_000) })
    assert.equal(response.status, 200, `Published registry metadata is unavailable: ${address}`)
    return response.json()
  }
  const packages = []
  for (let offset = 0; offset < names.length; offset += 6) {
    packages.push(...await Promise.all(names.slice(offset, offset + 6).map(async name => {
      const tags = await read(`${url}-/package/${encodeURIComponent(name)}/dist-tags`)
      assert.equal(tags[channel], metadata.version, `The ${channel} dist-tag moved past the documented release: ${name}`)
      const value = await read(`${url}${encodeURIComponent(name)}/${encodeURIComponent(metadata.version)}`)
      assert.equal(value.gitHead, metadata.releaseRevision, `Published package source differs: ${name}`)
      return { name, version: metadata.version, integrity: value.dist?.integrity, provenance: Boolean(value.dist?.attestations?.url) }
    })))
  }
  const registry = { url, channel, packages: packages.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0) }
  validateRegistryEvidence(registry, metadata)
  assert.deepEqual(registry.packages.map(pkg => pkg.name), names, 'Site release must retain the complete public source cohort')
  return registry
}

async function ciRegistry(metadata) {
  const names = await publicCohort()
  const registry = process.env.SITE_DELIVERY === 'release'
    ? registryFromState(JSON.parse(await readFile('release-artifacts/npm/promotion-state.json', 'utf8')), metadata, names)
    : await registryFromNpm(metadata, names)
  await verifyPublicRegistry(registry, metadata)
  return registry
}

async function writeGitHubFile(name, lines) {
  const file = process.env[name]
  assert.ok(file, `${name} is required`)
  await writeFile(file, lines.map(line => `${line}\n`).join(''), { flag: 'a' })
}

async function plan() {
  const channel = process.env.GITHUB_REF_NAME
  assert.ok(Object.hasOwn(channels, channel), 'Only main and rc can deliver the site')
  // aronrepo is installed by then; the hosted builder never plans, so it stays a lazy import.
  const { loadProjectPolicy, getDiffFiles, getVersionTags } = await import('aronrepo/node')
  const cwd = process.cwd()
  const { isReleasePath } = await loadProjectPolicy(cwd)
  assert.ok(isReleasePath, 'Release paths decide whether site-only commits can deliver')
  const result = planDelivery({ released: process.env.RELEASED === 'true', version: process.env.RELEASE_VERSION, channel,
    reachableTags: getVersionTags(cwd, 'HEAD'), releasePathChanges: tag => getDiffFiles(cwd, tag, 'HEAD').filter(isReleasePath) })
  await writeGitHubFile('GITHUB_OUTPUT', [`deliver=${result.deliver}`])
  if (!result.deliver) {
    console.log(`::notice title=Site delivery deferred::${result.reason}`)
    return
  }
  await writeGitHubFile('GITHUB_ENV', [`PUBLIC_VERSION=${result.version}`, `SITE_DELIVERY=${result.kind}`])
  console.log(`Delivering the site with ${result.kind === 'release' ? 'its release' : 'the unchanged packages of'} v${result.version}.`)
}

/**
 * A site-only delivery reuses the output that validation built and browser-verified with this
 * delivery's identity. Any difference rebuilds: the report must prove these exact final bytes.
 */
async function reuse() {
  const metadata = ciMetadata()
  const report = 'site/test-results/release-site.json'
  let reused = false
  if (process.env.SITE_DELIVERY !== 'site') console.log(`A release delivery builds with its own version, ${metadata.tag}.`)
  else {
    try {
      await checkVerifiedOutput('site/out', metadata, await readFile(report))
      reused = true
      console.log(`Reusing the validation build browser-verified for ${metadata.tag} at ${metadata.revision}.`)
    } catch (error) {
      console.log(`::notice title=Site rebuilds::The validation build cannot be reused: ${error.message.split('\n')[0]}`)
    }
  }
  if (!reused) await Promise.all([rm('site/out', { recursive: true, force: true }), rm(report, { force: true })])
  await writeGitHubFile('GITHUB_OUTPUT', [`reused=${reused}`])
}

async function cleanBuildCache() {
  // This generated, untracked cache otherwise changes Reference sourceState on
  // a repeated build. Its contents are recreated and disclosed by the report.
  await rm('site/.cache', { recursive: true, force: true })
}

async function deliver(metadata) {
  const file = 'release-artifacts/site-delivery.json'
  let receipt = { schemaVersion: 2, attempts: [] }
  try { receipt = JSON.parse(await readFile(file, 'utf8')) } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  assert.equal(receipt.schemaVersion, 2, 'Preserve and reconcile an unfamiliar delivery receipt before retrying')
  assert.ok(Array.isArray(receipt.attempts))
  const attempt = { sequence: receipt.attempts.length + 1, ...metadata, mode: process.env.PAGES_RELEASE_MODE,
    runId: process.env.GITHUB_RUN_ID ?? null, runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    startedAt: new Date().toISOString(), status: 'running', phase: 'intent',
    immutablePagesVerified: false, canonicalVerified: false, writes: [], events: [] }
  receipt.attempts.push(attempt)
  const save = async (phase, values = {}) => {
    Object.assign(attempt, values, { phase, updatedAt: new Date().toISOString() })
    attempt.events.push({ phase, at: attempt.updatedAt })
    await mkdir(path.dirname(file), { recursive: true })
    const temporary = `${file}.${process.pid}.tmp`
    await writeFile(temporary, jsonBytes(receipt))
    await rename(temporary, file)
  }
  const onWrite = async ({ operation, stage, httpStatus }) => {
    assert.ok(['create-manifest', 'advance-pointer', 'create-pointer'].includes(operation))
    if (stage === 'before') attempt.writes.push({ operation, outcome: 'unknown', startedAt: new Date().toISOString() })
    else {
      const write = attempt.writes.at(-1)
      assert.equal(write?.operation, operation)
      Object.assign(write, { httpStatus, respondedAt: new Date().toISOString(),
        outcome: httpStatus >= 200 && httpStatus < 300 ? 'acknowledged'
          : [400, 401, 403, 404, 409, 422].includes(httpStatus) ? 'rejected' : 'unknown' })
    }
    await save(`${operation}-${stage}`)
  }
  await save('intent')
  try {
    await save('verify-input')
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
    await verifyOutput('site/out', manifest, metadata)
    await verifyPublicRegistry(manifest.registry, metadata)
    await save('publish-manifest', { manifestSha256: sha256(jsonBytes(manifest)),
      asset: { name: manifestName(metadata), url: manifestUrl(metadata), verified: false } })
    const options = { token: process.env.GITHUB_TOKEN, onWrite }
    const asset = await publishManifest(metadata, jsonBytes(manifest), options)
    await save('advance-pointer', { asset: { ...asset, verified: true },
      pointer: { branch: metadata.deliveryBranch, requestedRevision: metadata.revision, verified: false } })
    const startedAt = new Date().toISOString()
    const pointer = await advancePointer(metadata, options)
    await save('wait-pages', { pointer: { ...attempt.pointer, ...pointer, verified: true, revision: metadata.revision } })
    // Keep release concurrency held until the external build actually deploys.
    const proof = await waitForPages(metadata, { ...options, startedAt: pointer.advanced ? startedAt : asset.createdAt, manifest })
    await save('pages-verified', { pages: proof, immutablePagesVerified: true })
    if (attempt.mode === 'production') {
      await save('verify-canonical')
      await verifyLiveIdentity(metadata.origin, metadata, manifest)
      await save('canonical-verified', { canonicalVerified: true })
    }
    await save('complete', { status: 'success' })
    console.log(JSON.stringify(attempt))
  } catch {
    // Never serialize Error messages, response bodies, request headers or token
    // values. Unknown write outcomes stay unknown until a later read proves them.
    const phase = attempt.phase
    await save(phase, { status: 'failed', failure: { phase, code: 'PAGES_DELIVERY_NOT_VERIFIED' } })
    throw new Error(`Pages delivery failed during ${phase}; inspect ${file} before retrying`)
  }
}

async function main(command, directory) {
  if (command === 'canonical') {
    assert.ok(directory, 'The retained exact public release manifest is required')
    const localBytes = await readFile(directory)
    const manifest = JSON.parse(localBytes)
    const metadata = validateManifest(manifest)
    assert.equal(tagTargets(git(['ls-remote', '--tags', remote, 'v*'])).get(metadata.tag), metadata.releaseRevision, 'The documented release tag moved')
    const downloaded = await downloadManifest(metadata)
    assert.ok(downloaded.bytes.equals(localBytes), 'Retained manifest differs from its public release asset')
    await verifyPublicRegistry(manifest.registry, metadata)
    await verifyLiveIdentity(metadata.origin, metadata, manifest)
    const proof = { revision: metadata.revision, version: metadata.version, origin: metadata.origin,
      canonicalVerified: true, manifestSha256: sha256(localBytes), checkedAt: new Date().toISOString() }
    await mkdir('release-artifacts', { recursive: true })
    await writeFile('release-artifacts/site-canonical.json', jsonBytes(proof))
    console.log(JSON.stringify(proof))
    return
  }
  if (command === 'hosted-prepare') {
    assert.ok(directory, 'A temporary evidence directory is required')
    const metadata = hostedMetadata()
    const { manifest, bytes } = await downloadManifest(metadata)
    assert.deepEqual(manifest.registry.packages.map(pkg => pkg.name), await publicCohort())
    await verifyPublicRegistry(manifest.registry, metadata)
    await cleanBuildCache()
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, 'manifest.json'), bytes)
    await writeFile(path.join(directory, 'environment'), Object.entries({ PUBLIC_COMMIT_REF: metadata.channel,
      PUBLIC_VERSION: metadata.version, PUBLIC_URL: metadata.origin, MASTER_CSS_IMAGE_TRANSFORMATIONS: 'false'
    }).map(([key, value]) => `${key}=${value}`).join('\n') + '\n')
    console.log(`Prepared ${metadata.tag} at ${metadata.revision}; public registry and release manifest verified.`)
    return
  }
  if (command === 'hosted-verify') {
    const metadata = hostedMetadata()
    const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'))
    await prepareIdentity('site/out', metadata)
    await verifyPublicRegistry(manifest.registry, metadata)
    const proof = await verifyOutput('site/out', manifest, metadata)
    const pointer = git(['ls-remote', '--heads', remote, `refs/heads/${metadata.deliveryBranch}`])
    assert.equal(pointer, `${metadata.revision}\trefs/heads/${metadata.deliveryBranch}`, 'A newer release superseded this Pages build')
    console.log(JSON.stringify(proof))
    return
  }
  if (command === 'plan') return plan()
  if (command === 'reuse') return reuse()
  const metadata = ciMetadata()
  if (command === 'preflight') {
    await ciRegistry(metadata)
    await cleanBuildCache()
  } else if (command === 'identity') await prepareIdentity('site/out', metadata)
  else if (command === 'manifest') {
    const registry = await ciRegistry(metadata)
    const manifest = await createManifest('site/out', metadata, await readFile('site/test-results/release-site.json'), registry)
    await mkdir(path.dirname(manifestFile), { recursive: true })
    await writeFile(manifestFile, jsonBytes(manifest))
    console.log(`Verified ${manifest.files.length} exact output files for ${metadata.tag} at ${metadata.revision}.`)
  } else if (command === 'deliver') await deliver(metadata)
  else throw new Error('Expected plan, reuse, preflight, identity, manifest, deliver, canonical, hosted-prepare or hosted-verify')
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main(process.argv[2], process.argv[3])
}
