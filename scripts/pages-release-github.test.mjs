import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advancePointer, completedPagesCheck, downloadManifest, downloadPublicBytes, publishManifest, verifyLiveIdentity, waitForLiveIdentity, waitForPages } from './pages-release-github.mjs'
import { identityPath, inventoryDigest, jsonBytes, manifestName, manifestUrl, sha256 } from './pages-site-manifest.mjs'

const metadata = { repository: 'master-co/css', revision: 'a'.repeat(40), releaseRevision: 'a'.repeat(40), version: '2.0.0', tag: 'v2.0.0',
  channel: 'main', deliveryBranch: 'pages-stable', project: 'fixture', subdomain: 'fixture-suffix.pages.dev',
  origin: 'https://css.master.co', imageTransformations: false, legacyDesignCutover: false }
const files = [{ path: 'index.html', size: 10, sha256: 'a'.repeat(64) }, { path: identityPath, size: 20, sha256: 'b'.repeat(64) }]
const manifest = { schemaVersion: 1, ...metadata, files, buildDigest: inventoryDigest(files),
  registry: { url: 'https://registry.npmjs.org/', channel: 'latest', packages: [
    { name: '@master/css', version: '2.0.0', integrity: 'sha512-YQ==', provenance: true }
  ] }, verification: { reportSha256: 'c'.repeat(64), pages: 1, localLinks: 2,
    profilesByEngine: { chromium: 1, firefox: 1, webkit: 1 }, failures: 0, sourceStatus: [] } }
const token = 'fixture-token', data = jsonBytes(manifest), assetName = manifestName(metadata)
const createdAt = '2026-11-05T00:00:00Z'
const identity = { schemaVersion: 1, ...metadata, payloadDigest: inventoryDigest(files.filter(file => file.path !== identityPath)) }
const json = (value, status = 200) => new Response(JSON.stringify(value), { status })

function releaseApi({ existing, conflict, race = false, immutable = false } = {}) {
  let remoteBytes = existing ? (conflict ?? data) : undefined
  const calls = []
  const asset = () => ({ id: 7, name: assetName, size: remoteBytes.length, digest: `sha256:${sha256(remoteBytes)}`,
    browser_download_url: manifestUrl(metadata), created_at: createdAt })
  const fetchApi = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET' })
    if (url === manifestUrl(metadata)) {
      assert.ok(!options.headers?.Authorization, 'Never forward the workflow token to public asset storage')
      return new Response(remoteBytes)
    }
    assert.equal(options.headers.Authorization, `Bearer ${token}`)
    assert.equal(options.redirect, 'error')
    if (url.includes('/releases/tags/')) return json({ id: 3, tag_name: metadata.tag, draft: false, prerelease: false, immutable })
    if (url.includes('/releases/3/assets?per_page=')) return json(remoteBytes ? [asset()] : [])
    if (url.startsWith('https://uploads.github.com/')) {
      assert.equal(options.method, 'POST')
      assert.equal(new URL(url).searchParams.get('name'), assetName)
      remoteBytes = race ? data : Buffer.from(options.body)
      return json(race ? {} : asset(), race ? 422 : 201)
    }
    throw new Error('Unexpected request')
  }
  return { fetchApi, calls }
}

test('a manifest is created once and the public downloaded bytes are checked before ref advancement', async () => {
  const server = releaseApi()
  const proof = await publishManifest(metadata, data, { token, fetchApi: server.fetchApi })
  assert.equal(proof.sha256, sha256(data))
  assert.equal(proof.createdAt, createdAt)
  assert.equal(server.calls.filter(call => call.method === 'POST').length, 1)
  await publishManifest(metadata, data, { token, fetchApi: server.fetchApi })
  assert.equal(server.calls.filter(call => call.method === 'POST').length, 1)
  assert.ok(server.calls.every(call => !['PATCH', 'PUT', 'DELETE'].includes(call.method)))
})

test('existing conflicting bytes are refused without replacing or deleting the release asset', async () => {
  const changed = jsonBytes({ ...manifest, verification: { ...manifest.verification, reportSha256: 'd'.repeat(64) } })
  const server = releaseApi({ existing: true, conflict: changed })
  await assert.rejects(publishManifest(metadata, data, { token, fetchApi: server.fetchApi }))
  assert.ok(server.calls.every(call => call.method === 'GET'))
})

test('a concurrent create is accepted only when its already-published bytes agree', async () => {
  const server = releaseApi({ race: true })
  await publishManifest(metadata, data, { token, fetchApi: server.fetchApi })
  assert.equal(server.calls.filter(call => call.method === 'POST').length, 1)
})

test('a platform-immutable GitHub release cannot receive a new asset after publication', async () => {
  const absent = releaseApi({ immutable: true })
  await assert.rejects(publishManifest(metadata, data, { token, fetchApi: absent.fetchApi }), /still draft/)
  assert.ok(absent.calls.every(call => call.method === 'GET'))
  const existing = releaseApi({ immutable: true, existing: true })
  await publishManifest(metadata, data, { token, fetchApi: existing.fetchApi })
})

test('public manifest transport follows only bounded official storage redirects without credentials', async () => {
  const calls = []
  const fetchApi = async (url, options) => {
    calls.push(url)
    assert.equal(options.redirect, 'manual')
    assert.equal(options.headers, undefined)
    if (url === manifestUrl(metadata)) return new Response(null, { status: 302, headers: { location: 'https://release-assets.githubusercontent.com/fixture' } })
    return new Response(data)
  }
  assert.deepEqual((await downloadManifest(metadata, fetchApi)).manifest, manifest)
  assert.equal(calls.length, 2)
  await assert.rejects(downloadPublicBytes('https://untrusted.example/evidence', fetchApi), /Unexpected/)
  await assert.rejects(downloadPublicBytes(manifestUrl(metadata), async () => new Response(null, { status: 302,
    headers: { location: 'https://untrusted.example/evidence' } })), /Unexpected/)
  await assert.rejects(downloadManifest(metadata, async () => json({ ...manifest, revision: 'f'.repeat(40) })))
})

function pointerApi({ initial = 'b'.repeat(40), reject = false, concurrent = false } = {}) {
  let current = initial, reads = 0
  const mutations = []
  return { mutations, fetchApi: async (url, options) => {
    assert.equal(options.headers.Authorization, `Bearer ${token}`)
    if (!options.method) {
      reads++
      if (!current) return json({}, 404)
      return json({ ref: `refs/heads/${metadata.deliveryBranch}`, object: { type: 'commit', sha: concurrent && reads > 1 ? 'f'.repeat(40) : current } })
    }
    const body = JSON.parse(options.body)
    mutations.push({ url, method: options.method, body })
    if (reject) return json({}, 422)
    current = body.sha
    return json({}, options.method === 'POST' ? 201 : 200)
  } }
}

test('an existing delivery ref advances without force and without creating a commit', async () => {
  const server = pointerApi()
  assert.deepEqual(await advancePointer(metadata, { token, fetchApi: server.fetchApi }), { advanced: true })
  assert.deepEqual(server.mutations.map(call => [call.method, call.body]), [['PATCH', { sha: metadata.revision, force: false }]])
  assert.ok(server.mutations[0].url.endsWith('/git/refs/heads/pages-stable'))
  await assert.rejects(advancePointer({ ...metadata, deliveryBranch: 'main' }, { token, fetchApi: async () => { throw new Error('must not request') } }))
})

test('initial creation and already-selected source remain distinct from force or synthetic commits', async () => {
  const initial = pointerApi({ initial: null })
  await advancePointer(metadata, { token, fetchApi: initial.fetchApi })
  assert.deepEqual(initial.mutations.map(call => [call.method, call.body]), [['POST', { ref: 'refs/heads/pages-stable', sha: metadata.revision }]])
  const same = pointerApi({ initial: metadata.revision })
  assert.deepEqual(await advancePointer(metadata, { token, fetchApi: same.fetchApi }), { advanced: false })
  assert.equal(same.mutations.length, 0)
  await assert.rejects(advancePointer(metadata, { token, fetchApi: pointerApi({ reject: true }).fetchApi }), /fast-forward/)
  await assert.rejects(advancePointer(metadata, { token, fetchApi: pointerApi({ concurrent: true }).fetchApi }), /concurrently/)
})

const deploymentId = '12345678-1234-1234-1234-123456789abc'
const check = { id: 42, head_sha: metadata.revision, app: { slug: 'cloudflare-workers-and-pages' }, name: `Cloudflare Pages: ${metadata.project}`,
  started_at: createdAt, status: 'completed', conclusion: 'success', external_id: deploymentId,
  details_url: `https://dash.cloudflare.com/?to=/fixture-account/pages/view/${metadata.project}/${deploymentId}` }

test('the watcher identifies the actual Cloudflare App, project route and exact source rather than another same-named check', () => {
  const proof = completedPagesCheck([check], { metadata, startedAt: createdAt })
  assert.equal(proof.deploymentUrl, `https://12345678.${metadata.subdomain}`)
  assert.ok(!JSON.stringify(proof).includes(deploymentId))
  assert.equal(completedPagesCheck([{ ...check, name: 'Cloudflare Pages' }], { metadata, startedAt: createdAt }).checkRunId, 42)
  for (const wrong of [
    { ...check, head_sha: 'f'.repeat(40) }, { ...check, app: { slug: 'github-actions' } },
    { ...check, name: 'Workers Builds: fixture' }, { ...check, name: 'Cloudflare Pages: other-project' }, { ...check, started_at: '2025-01-01T00:00:00Z' },
    { ...check, details_url: check.details_url.replace('/fixture/', '/other-project/') },
    { ...check, details_url: check.details_url.replace('dash.cloudflare.com', 'untrusted.example') }
  ]) assert.equal(completedPagesCheck([wrong], { metadata, startedAt: createdAt }), null)
  assert.equal(completedPagesCheck([{ ...check, status: 'in_progress' }], { metadata, startedAt: createdAt }), null)
  assert.throws(() => completedPagesCheck([{ ...check, conclusion: 'failure' }], { metadata, startedAt: createdAt }))
})

test('all-check selection separates projects and accepts a newer official retry only after it finishes', () => {
  const other = { ...check, id: 100, details_url: check.details_url.replace('/fixture/', '/other-project/') }
  assert.equal(completedPagesCheck([other, check], { metadata, startedAt: createdAt }).checkRunId, 42)
  assert.equal(completedPagesCheck([check, { ...check, id: 43, status: 'in_progress' }], { metadata, startedAt: createdAt }), null)
})

test('an App success is followed by an unauthenticated immutable identity check', async () => {
  const calls = []
  const fetchApi = async (url, options) => {
    calls.push(url)
    if (url.startsWith('https://api.github.com/')) {
      assert.ok(url.includes('filter=all'))
      assert.equal(options.headers.Authorization, `Bearer ${token}`)
      return json({ check_runs: [check] })
    }
    assert.equal(url, `https://12345678.${metadata.subdomain}/${identityPath}`)
    assert.equal(options.headers, undefined)
    return new Response(JSON.stringify(identity), { headers: { 'X-Robots-Tag': 'noindex' } })
  }
  const proof = await waitForPages(metadata, { token, startedAt: createdAt, manifest, fetchApi })
  assert.equal(proof.checkRunId, 42)
  assert.equal(calls.length, 2)
  await verifyLiveIdentity(metadata.origin, metadata, manifest, async () => json(identity))
  await assert.rejects(verifyLiveIdentity(metadata.origin, metadata, manifest, async () => json({ ...identity, revision: 'f'.repeat(40) })))
  await assert.rejects(verifyLiveIdentity(metadata.origin, metadata, manifest, async () => json({}, 404)))
})

test('immutable Pages identity requires its real noindex response header while canonical identity does not', async () => {
  const immutable = `https://12345678.${metadata.subdomain}`
  await assert.rejects(verifyLiveIdentity(immutable, metadata, manifest, async () => json(identity), { requireNoindex: true }), /X-Robots-Tag/)
  await assert.rejects(verifyLiveIdentity(immutable, metadata, manifest, async () => new Response(JSON.stringify(identity), {
    headers: { 'X-Robots-Tag': 'noarchive, notnoindex' }
  }), { requireNoindex: true }), /X-Robots-Tag/)
  await verifyLiveIdentity(immutable, metadata, manifest, async () => new Response(JSON.stringify(identity), {
    headers: { 'X-Robots-Tag': 'noarchive, NoINDEX, nofollow' }
  }), { requireNoindex: true })
  await verifyLiveIdentity(metadata.origin, metadata, manifest, async () => json(identity))
})

test('the canonical identity is polled until the custom domain serves the exact build', async () => {
  let calls = 0
  const waits = []
  await waitForLiveIdentity(metadata.origin, metadata, manifest, {
    fetchApi: async () => ++calls < 3 ? json({ ...identity, revision: 'f'.repeat(40) }) : json(identity),
    wait: async ms => { waits.push(ms) }
  })
  assert.equal(calls, 3)
  assert.deepEqual(waits, [15_000, 15_000])
  await assert.rejects(waitForLiveIdentity(metadata.origin, metadata, manifest, {
    fetchApi: async () => json({ ...identity, revision: 'f'.repeat(40) }), wait: async () => {}, timeout: 0
  }), /identity differs/)
})

test('a skipped or missing Pages check cannot turn the aggregate delivery green', async () => {
  await assert.rejects(waitForPages(metadata, { token, startedAt: createdAt, manifest,
    fetchApi: async () => json({ check_runs: [] }), wait: async () => {}, timeout: 2 }), /Timed out/)
})
