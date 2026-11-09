import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { identityPath, inventoryDigest, manifestName, manifestUrl, releaseMetadata, repository, sha256, validateManifest } from './pages-site-manifest.mjs'

const api = `https://api.github.com/repos/${repository}`
const maximumBytes = 32 * 1024 ** 2

async function bytes(response) {
  let size = 0
  const chunks = []
  for await (const chunk of response.body ?? []) {
    size += chunk.length
    assert.ok(size <= maximumBytes, 'Release evidence exceeds its download bound')
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function downloadPublicBytes(url, fetchApi = fetch) {
  for (let redirects = 0; redirects < 5; redirects++) {
    const target = new URL(url)
    assert.equal(target.protocol, 'https:')
    assert.ok(!target.username && !target.password && !target.port)
    assert.ok(['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com'].includes(target.hostname), 'Unexpected public release asset host')
    const response = await fetchApi(target.href, { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      url = new URL(response.headers.get('location'), target).href
      continue
    }
    assert.equal(response.status, 200, `Public release evidence download failed (HTTP ${response.status})`)
    return bytes(response)
  }
  throw new Error('Too many public release asset redirects')
}

export async function downloadManifest(metadata, fetchApi = fetch) {
  releaseMetadata(metadata)
  const data = await downloadPublicBytes(manifestUrl(metadata), fetchApi)
  const manifest = JSON.parse(data)
  validateManifest(manifest, metadata)
  return { bytes: data, manifest }
}

function apiClient(token, fetchApi) {
  assert.ok(token, 'The workflow repository token is required')
  return async (route, options = {}) => {
    const url = route.startsWith('https://uploads.github.com/') ? route : api + route
    assert.ok(url.startsWith(api + '/') || url.startsWith(`https://uploads.github.com/repos/${repository}/releases/`))
    const response = await fetchApi(url, { ...options, headers: {
      Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    }, redirect: 'error', signal: AbortSignal.timeout(30_000) })
    return { status: response.status, value: JSON.parse((await bytes(response)).toString() || '{}') }
  }
}

async function writeRequest(request, route, options, operation, onWrite) {
  // Persist the intent before sending anything. A lost response must remain
  // unknown even if the server actually applied the requested mutation.
  await onWrite?.({ operation, stage: 'before' })
  const response = await request(route, options)
  await onWrite?.({ operation, stage: 'after', httpStatus: response.status })
  return response
}

/** Create an asset once. An existing name must contain exactly the same bytes. */
export async function publishManifest(metadata, data, { token, fetchApi = fetch, onWrite } = {}) {
  validateManifest(JSON.parse(data), metadata)
  const request = apiClient(token, fetchApi)
  const release = await request(`/releases/tags/${encodeURIComponent(metadata.tag)}`)
  assert.equal(release.status, 200, 'The actual published GitHub release is required')
  assert.equal(release.value.tag_name, metadata.tag)
  assert.equal(release.value.draft, false)
  assert.equal(release.value.prerelease, metadata.channel !== 'main')
  assert.ok(Number.isSafeInteger(release.value.id) && release.value.id > 0)
  const name = manifestName(metadata)
  const list = async () => {
    const assets = []
    for (let page = 1; page <= 10; page++) {
      const batch = await request(`/releases/${release.value.id}/assets?per_page=100&page=${page}`)
      assert.equal(batch.status, 200)
      assert.ok(Array.isArray(batch.value))
      assets.push(...batch.value)
      if (batch.value.length < 100) return assets
    }
    throw new Error('Too many release assets')
  }
  let matches = (await list()).filter(asset => asset.name === name)
  assert.ok(matches.length <= 1, 'Duplicate site manifest release assets')
  if (!matches.length) {
    assert.notEqual(release.value.immutable, true, 'GitHub platform-immutable releases must receive every asset while still draft; do not change that policy or work around it')
    const upload = await writeRequest(request, `https://uploads.github.com/repos/${repository}/releases/${release.value.id}/assets?name=${encodeURIComponent(name)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data
    }, 'create-manifest', onWrite)
    // A concurrent create may win. Re-read and compare; never replace/delete it.
    assert.ok([201, 422].includes(upload.status), `Site manifest creation failed (HTTP ${upload.status})`)
    matches = (await list()).filter(asset => asset.name === name)
  }
  assert.equal(matches.length, 1, 'Require exactly one published site manifest')
  const asset = matches[0]
  assert.equal(asset.browser_download_url, manifestUrl(metadata))
  assert.equal(asset.size, data.length)
  if (asset.digest) assert.equal(asset.digest, `sha256:${sha256(data)}`)
  const downloaded = await downloadPublicBytes(asset.browser_download_url, fetchApi)
  assert.ok(downloaded.equals(data), 'Existing site manifest bytes differ; never clobber a release asset')
  assert.ok(Number.isFinite(Date.parse(asset.created_at)), 'Published asset creation time is required')
  return { name, sha256: sha256(data), url: asset.browser_download_url, createdAt: asset.created_at }
}

/** GitHub's ref update API without force is fast-forward-only; no commit is made. */
export async function advancePointer(metadata, { token, fetchApi = fetch, onWrite } = {}) {
  releaseMetadata(metadata)
  const request = apiClient(token, fetchApi)
  const ref = `heads/${metadata.deliveryBranch}`
  const current = await request(`/git/ref/${ref}`)
  assert.ok([200, 404].includes(current.status), 'Cannot read the current Pages delivery ref')
  if (current.status === 200) {
    assert.equal(current.value.ref, `refs/${ref}`)
    assert.equal(current.value.object?.type, 'commit')
    if (current.value.object.sha === metadata.revision) return { advanced: false }
    const result = await writeRequest(request, `/git/refs/${ref}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha: metadata.revision, force: false }) }, 'advance-pointer', onWrite)
    assert.equal(result.status, 200, 'Pages delivery ref must advance fast-forward; reconcile divergence without force')
  } else {
    const result = await writeRequest(request, '/git/refs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: `refs/${ref}`, sha: metadata.revision }) }, 'create-pointer', onWrite)
    assert.equal(result.status, 201, 'Cannot create the initial Pages delivery ref')
  }
  const final = await request(`/git/ref/${ref}`)
  assert.equal(final.status, 200)
  assert.equal(final.value.object?.sha, metadata.revision, 'Pages delivery ref changed concurrently')
  return { advanced: true }
}

export function completedPagesCheck(checks, { metadata, startedAt }) {
  const found = checks.filter(check => check.head_sha === metadata.revision
    && check.app?.slug === 'cloudflare-workers-and-pages'
    // Cloudflare renamed the check from `Cloudflare Pages` to `Cloudflare Pages: <project>`.
    && [`Cloudflare Pages`, `Cloudflare Pages: ${metadata.project}`].includes(check.name)
    && Date.parse(check.started_at ?? check.created_at) >= Date.parse(startedAt) - 1000)
  // The App uses one check name across projects. Identify the project from its
  // dashboard route, including Cloudflare's observed ?to=/... route form.
  const matching = found.filter(check => {
    let url
    try { url = new URL(check.details_url) } catch { return false }
    if (url.protocol !== 'https:' || url.hostname !== 'dash.cloudflare.com') return false
    const route = url.searchParams.get('to') ?? url.pathname
    return route.endsWith(`/pages/view/${metadata.project}/${check.external_id}`)
  }).sort((a, b) => b.id - a.id)
  if (!matching.length || matching[0].status !== 'completed') return null
  assert.equal(matching[0].conclusion, 'success', 'Cloudflare Pages did not successfully deploy the verified site')
  assert.ok(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(matching[0].external_id ?? ''), 'Pages check has an invalid deployment identity')
  return { checkRunId: matching[0].id, revision: metadata.revision, conclusion: 'success',
    deploymentUrl: `https://${matching[0].external_id.slice(0, 8)}.${metadata.subdomain}` }
}

export async function verifyLiveIdentity(origin, metadata, manifest, fetchApi = fetch, { requireNoindex = false } = {}) {
  validateManifest(manifest, metadata)
  const url = new URL(origin)
  assert.equal(url.protocol, 'https:')
  assert.ok(!url.username && !url.password && !url.port && url.pathname === '/' && !url.search && !url.hash)
  assert.ok(url.origin === metadata.origin || new RegExp(`^https://[a-f0-9]{8}\\.${metadata.subdomain.replaceAll('.', '\\.')}$`).test(url.origin))
  const response = await fetchApi(`${url.origin}/${identityPath}`, { redirect: 'error', signal: AbortSignal.timeout(30_000) })
  assert.equal(response.status, 200, 'The public site must expose its release identity')
  if (requireNoindex) assert.ok((response.headers.get('x-robots-tag') ?? '').toLowerCase().split(/[\s,]+/).includes('noindex'), 'The immutable Pages host must return X-Robots-Tag: noindex')
  assert.deepEqual(JSON.parse(await bytes(response)), { schemaVersion: 1, ...metadata,
    payloadDigest: inventoryDigest(manifest.files.filter(file => file.path !== identityPath)) }, 'The deployed Pages identity differs')
}

/**
 * The custom domain can keep serving the previous build for a short while after Cloudflare
 * reports the exact deployment, so the canonical identity is polled within a bounded window.
 * Only the exact identity passes; the last mismatch is rethrown when the window closes.
 */
export async function waitForLiveIdentity(origin, metadata, manifest, { fetchApi = fetch, wait = delay, timeout = 10 * 60_000, interval = 15_000 } = {}) {
  const deadline = performance.now() + timeout
  for (;;) {
    try {
      return await verifyLiveIdentity(origin, metadata, manifest, fetchApi)
    } catch (error) {
      if (performance.now() >= deadline) throw error
    }
    await wait(Math.min(interval, Math.max(0, deadline - performance.now())))
  }
}

export async function waitForPages(metadata, { token, startedAt, manifest, fetchApi = fetch, wait = delay, timeout = 45 * 60_000 } = {}) {
  validateManifest(manifest, metadata)
  assert.ok(Number.isFinite(Date.parse(startedAt)), 'Delivery start time is required')
  const request = apiClient(token, fetchApi)
  const deadline = performance.now() + timeout
  while (performance.now() < deadline) {
    const checks = []
    for (let page = 1; page <= 10; page++) {
      const result = await request(`/commits/${metadata.revision}/check-runs?per_page=100&page=${page}&filter=all`)
      assert.equal(result.status, 200)
      assert.ok(Array.isArray(result.value.check_runs))
      checks.push(...result.value.check_runs)
      if (result.value.check_runs.length < 100) break
      assert.ok(page < 10, 'Too many checks to identify the Pages deployment')
    }
    const proof = completedPagesCheck(checks, { metadata, startedAt })
    if (proof) {
      await verifyLiveIdentity(proof.deploymentUrl, metadata, manifest, fetchApi, { requireNoindex: true })
      return proof
    }
    await wait(Math.min(15_000, Math.max(0, deadline - performance.now())))
  }
  throw new Error('Timed out waiting for the exact Pages Git deployment; a skipped/missing check is not success')
}
