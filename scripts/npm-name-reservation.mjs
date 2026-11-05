import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { execa } from 'execa'
import { bootstrapNpmSession, githubReader } from './npm-package-bootstrap.mjs'
import { npmRegistry } from './npm-oidc.mjs'

const repository = 'master-co/css', repositoryId = 434642460
const workflow = '.github/workflows/npm-name-reservation.yml'
const jobName = 'Reserve npm names without releasing staged contents'
const canary = '@master/css-nuxt'
const selections = Object.freeze({ 'nuxt-canary': Object.freeze([canary]),
  'remaining-four': Object.freeze(['@master/css-svelte', '@master/css-svelte-addon', '@master/css-vscode', '@master/css-webpack']) })
export const confirmations = Object.freeze({ 'nuxt-canary': 'STAGE NUXT NAME ONLY', 'remaining-four': 'STAGE REMAINING FOUR NAMES ONLY' })
const stageTag = 'name-reservation', placeholderVersion = '0.0.0-stage', npmVersion = '11.21.0'
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
const sha = (bytes, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(bytes).digest(encoding)
const archiveIdentity = bytes => ({ bytes: bytes.length, sha256: sha(bytes), shasum: sha(bytes, 'sha1'), integrity: `sha512-${sha(bytes, 'sha512', 'base64')}` })
const slug = name => name.split('/')[1]
const escaped = name => name.replace('/', '%2f')
const save = async (path, value) => {
  await writeFile(path + '.tmp', JSON.stringify(value, null, 2) + '\n', { mode: 0o600 })
  await rename(path + '.tmp', path)
}
const isObject = value => value && typeof value === 'object' && !Array.isArray(value)

function positiveId(value) {
  assert.ok(/^[1-9]\d*$/.test(String(value ?? '')) && Number.isSafeInteger(Number(value)), 'Use a positive run ID')
  return Number(value)
}

export function reservationRequest({ selection, run, attempt, revision, canaryRun }) {
  assert.ok(Object.hasOwn(selections, selection), 'Choose the Nuxt canary or the four remaining names')
  run = positiveId(run)
  assert.equal(positiveId(attempt), 1, 'A reservation must be dispatched as a fresh run, never rerun')
  assert.match(revision ?? '', /^[a-f0-9]{40}$/)
  if (selection === 'remaining-four') {
    canaryRun = positiveId(canaryRun)
    assert.notEqual(canaryRun, run)
  } else assert.ok(!canaryRun, 'The Nuxt canary cannot reference a previous run')
  return { selection, run, attempt: 1, revision, ...(canaryRun && { canaryRun }), version: `0.0.0-reserve.${run}.1`, names: selections[selection] }
}

function reservedManifest(name, version) {
  return { name, version, description: 'Temporary Master CSS namespace reservation submitted to npm staging.', license: 'UNLICENSED' }
}

const reservedReadme = '# Master CSS package name reservation\n\nThis archive contains no implementation. It is a temporary staging record for package setup.\n'
const placeholderDescription = 'Temporary package placeholder for staged publishing'
const placeholderReadme = '# Temporary Holding Version\n\nThis version is a temporary placeholder for this package. An operational version to replace this has been submitted for review and is awaiting a staged release.\n'

function tarFile(name, text) {
  const content = Buffer.from(text), header = Buffer.alloc(512)
  const octal = (number, length) => number.toString(8).padStart(length - 1, '0') + '\0'
  header.write(name, 0, 100)
  header.write(octal(0o644, 8), 100)
  header.write(octal(0, 8), 108)
  header.write(octal(0, 8), 116)
  header.write(octal(content.length, 12), 124)
  header.write(octal(0, 12), 136)
  header.fill(32, 148, 156)
  header.write('0', 156)
  header.write('ustar\0' + '00', 257)
  header.write(header.reduce((total, byte) => total + byte, 0).toString(8).padStart(6, '0') + '\0 ', 148)
  return Buffer.concat([header, content, Buffer.alloc((512 - content.length % 512) % 512)])
}

export function reservationArchive(name, version) {
  assert.ok(Object.values(selections).some(names => names.includes(name)))
  assert.match(version, /^0\.0\.0-reserve\.[1-9]\d*\.1$/)
  return gzipSync(Buffer.concat([tarFile('package/package.json', JSON.stringify(reservedManifest(name, version), null, 2) + '\n'),
    tarFile('package/README.md', reservedReadme), Buffer.alloc(1024)]), { level: 9 })
}

const inspectTar = String.raw`
import gzip,io,json,sys,tarfile
raw=sys.stdin.buffer.read(8193)
assert 0<len(raw)<=8192
with gzip.GzipFile(fileobj=io.BytesIO(raw)) as gz:
    data=gz.read(65537)
assert len(data)<=65536
files={}
root=False
with tarfile.open(fileobj=io.BytesIO(data),mode='r:') as archive:
    for item in archive:
        if item.name=='package' and item.isdir():
            assert not root and item.size==0
            root=True
            continue
        assert item.name in ('package/package.json','package/README.md') and item.name not in files
        assert item.isfile() and not item.issparse() and 0<item.size<=4096
        files[item.name]=archive.extractfile(item).read().decode('utf-8')
assert len(files)==2
print(json.dumps({'manifest':json.loads(files['package/package.json']),'readme':files['package/README.md']}))
`

async function inspectArchive(bytes, run, env) {
  const result = await run('python3', ['-c', inspectTar], { input: bytes, extendEnv: false, env: { PATH: env.PATH }, timeout: 15_000 })
  return JSON.parse(result.stdout)
}

export async function verifyReservationArchive(bytes, name, version, { run = execa, env = process.env, placeholder = false } = {}) {
  const parsed = await inspectArchive(bytes, run, env)
  assert.deepEqual(parsed.manifest, placeholder ? { name, version: placeholderVersion, stub: true, description: placeholderDescription } : reservedManifest(name, version))
  assert.equal(parsed.readme, placeholder ? placeholderReadme : reservedReadme)
  return archiveIdentity(bytes)
}

function reader(fetchMetadata, token) {
  return async (path, { statuses = [200], limit = 1024 ** 2, accept = 'application/json' } = {}) => {
    assert.ok(path && !path.startsWith('/') && !path.includes('://'))
    const url = new URL(path, npmRegistry)
    assert.equal(url.origin, new URL(npmRegistry).origin)
    const response = await fetchMetadata(url.href, { method: 'GET', headers: { accept, 'cache-control': 'no-cache', ...(token && { Authorization: `Bearer ${token}` }) },
      redirect: 'error', signal: AbortSignal.timeout(20_000) })
    assert.ok(statuses.includes(response.status), `Unexpected npm HTTP ${response.status} on ${url.pathname}`)
    if (response.status !== 200) { await response.body?.cancel(); return { status: response.status } }
    const chunks = []
    let size = 0
    for await (const chunk of response.body) {
      size += chunk.length
      assert.ok(size <= limit, 'npm response exceeds the permitted size')
      chunks.push(Buffer.from(chunk))
    }
    const bytes = Buffer.concat(chunks)
    return { status: 200, bytes, ...(accept === 'application/json' && { document: JSON.parse(bytes) }) }
  }
}

async function assertReleaseHeld(github) {
  const release = await github.api('/actions/workflows/release.yml')
  assert.equal(release.path, '.github/workflows/release.yml')
  assert.equal(release.state, 'disabled_manually', 'Keep Release disabled throughout npm name reservation')
}

async function assertAbsent(name, version, anonymous, authenticated) {
  const path = escaped(name)
  const absentPaths = [path, path + '?write=true', `${path}/${placeholderVersion}`, `${path}/${version}`]
  await Promise.all([anonymous, ...(authenticated ? [authenticated] : [])].flatMap(read => absentPaths.map(route => read(route, { statuses: [404] }))))
  // npm's direct tags route returns 401 for an anonymously missing package.
  // Only the packument/exact-version 404s above count as absence evidence.
  await anonymous(`-/package/${path}/dist-tags`, { statuses: [401, 404] })
  if (authenticated) {
    const { document } = await authenticated(`-/stage?package=${encodeURIComponent(name)}&page=0&perPage=100`)
    assert.equal(document.total, 0, 'An authenticated staged version already reserves this name')
    assert.deepEqual(document.items, [])
  }
}

function checkPlaceholderTags(value) {
  assert.ok(isObject(value), 'Expected the public placeholder tag map')
  const tags = { ...value }
  delete tags._etag // npm's own dist-tag reader ignores this metadata field.
  assert.ok(Object.keys(tags).length === 0 || (Object.keys(tags).length === 1 && tags.latest === placeholderVersion), 'A tag exposes something other than the npm placeholder')
  return tags
}

async function readStage(item, authenticated) {
  const { stageId, name, version, archive } = item
  assert.match(stageId, uuid)
  const route = `-/stage/${stageId}`
  const result = await authenticated(route, { statuses: [200, 404] })
  if (result.status === 404) return null
  const data = result.document
  for (const [field, value] of Object.entries({ id: stageId, packageName: name, version, tag: stageTag, access: 'public', shasum: archive.shasum })) {
    assert.equal(data[field], value, `npm staged package ${field} differs`)
  }
  const { document: list } = await authenticated(`-/stage?package=${encodeURIComponent(name)}&page=0&perPage=100`)
  if (list.total === 0 && list.items.length === 0) return null
  assert.equal(list.total, 1, 'Another staged record is present for the selected name')
  assert.equal(list.items.length, 1)
  const [listed] = list.items
  for (const field of ['id', 'packageName', 'version', 'tag', 'access', 'shasum']) assert.equal(listed[field], data[field])
  assert.ok(['staged', 'validating'].includes(listed.status), 'Unexpected provider stage state')
  assert.ok(data.status === undefined || ['staged', 'validating'].includes(data.status), 'Unexpected provider stage details state')
  assert.ok(Number.isFinite(Date.parse(data.createdAt)))
  if (listed.status !== 'staged' || data.status === 'validating') return null
  const tar = await authenticated(`${route}/tarball`, { statuses: [200, 404], accept: 'application/octet-stream', limit: 8192 })
  if (tar.status === 404) return null
  assert.deepEqual(archiveIdentity(tar.bytes), archive, 'Authenticated staged tarball differs from the reserved bytes')
  return { stageId, tag: data.tag, status: listed.status, createdAt: data.createdAt, byteIdentical: true }
}

async function readPublicPlaceholder(item, anonymous, run, env) {
  const { name, version } = item, path = escaped(name), unscoped = slug(name)
  const publicPath = `@master/${unscoped}/-/${unscoped}`
  const [packument, exact, tagMap] = await Promise.all([
    anonymous(path + '?write=true', { statuses: [200, 404] }), anonymous(`${path}/${placeholderVersion}`, { statuses: [200, 404] }),
    anonymous(`-/package/${path}/dist-tags`, { statuses: [200, 401, 404] }),
    anonymous(`${path}/${version}`, { statuses: [404] }),
    anonymous(`${publicPath}-${version}.tgz`, { statuses: [404], accept: 'application/octet-stream' })
  ])
  if ([packument, exact, tagMap].some(response => response.status !== 200)) return null
  const data = packument.document, manifest = exact.document
  assert.equal(data.name, name)
  assert.deepEqual(Object.keys(data.versions), [placeholderVersion], 'The public registry must contain only its own placeholder version')
  const stub = data.versions[placeholderVersion]
  assert.equal(stub.stub, true, 'Fresh package metadata does not identify the npm placeholder')
  for (const entry of [stub, manifest]) {
    assert.equal(entry.name, name)
    assert.equal(entry.version, placeholderVersion)
    assert.equal(entry.description, placeholderDescription)
    assert.equal(entry.dist.fileCount, 2)
    assert.equal(entry.dist.tarball, `${npmRegistry}${publicPath}-${placeholderVersion}.tgz`)
  }
  const tags = checkPlaceholderTags(tagMap.document)
  const packumentTags = checkPlaceholderTags(data['dist-tags'])
  if (tags.latest !== packumentTags.latest) return null // Both individually safe views can converge at different times.
  const tarball = await anonymous(`${publicPath}-${placeholderVersion}.tgz`, { statuses: [200, 404], accept: 'application/octet-stream', limit: 8192 })
  if (tarball.status === 404) return null
  const archive = await verifyReservationArchive(tarball.bytes, name, placeholderVersion, { run, env, placeholder: true })
  for (const entry of [stub, manifest]) {
    assert.equal(entry.dist.integrity, archive.integrity)
    assert.equal(entry.dist.shasum, archive.shasum)
  }
  return { version: placeholderVersion, npmProviderStub: true, exactStagedManifestHTTPStatus: 404, exactStagedTarballHTTPStatus: 404,
    tags, archive, files: ['package/package.json', 'package/README.md'] }
}

const verificationDelays = [1000, 2000, 4000, 8000, ...Array(37).fill(30_000)]
async function verifyStaged(item, { anonymous, authenticated, run, env, wait }) {
  let placeholderObserved = false
  for (let i = 0; i <= verificationDelays.length; i++) {
    const [stage, initialPlaceholder] = await Promise.all([readStage(item, authenticated),
      placeholderObserved ? undefined : readPublicPlaceholder(item, anonymous, run, env)])
    const publicPlaceholder = stage && placeholderObserved ? await readPublicPlaceholder(item, anonymous, run, env) : initialPlaceholder
    if (stage && publicPlaceholder) return { stage, publicPlaceholder }
    placeholderObserved ||= Boolean(initialPlaceholder)
    if (i < verificationDelays.length) await wait(verificationDelays[i])
  }
  throw new Error('Staged bytes and the public placeholder did not both become visible; inspect the retained submission and do not restage')
}

const readReceiptZIP = String.raw`
import io,json,stat,sys,zipfile
raw=sys.stdin.buffer.read(1048577)
assert len(raw)<=1048576
with zipfile.ZipFile(io.BytesIO(raw)) as archive:
    matches=[f for f in archive.infolist() if f.filename=='reservation-receipt.json']
    assert len(matches)==1 and stat.S_IFMT(matches[0].external_attr>>16) in (0,stat.S_IFREG)
    assert 0<matches[0].file_size<65536
    print(json.dumps(json.loads(archive.read(matches[0]))))
`

async function readCanaryReceipt(request, github, run, env) {
  const id = request.canaryRun, route = `/actions/runs/${id}`
  const [workflowRecord, selected, latest, jobs, artifacts] = await Promise.all([
    github.api(`/actions/workflows/${workflow.split('/').at(-1)}`), github.api(`${route}/attempts/1`), github.api(route),
    github.pages(`${route}/attempts/1/jobs`, 'jobs'), github.pages(`${route}/artifacts`, 'artifacts')
  ])
  assert.equal(workflowRecord.path, workflow)
  for (const candidate of [selected, latest]) {
    for (const [key, value] of Object.entries({ id, run_attempt: 1, path: workflow, workflow_id: workflowRecord.id,
      head_sha: request.revision, head_branch: 'rc', event: 'workflow_dispatch', status: 'completed', conclusion: 'success' })) assert.equal(candidate[key], value)
    assert.equal(candidate.repository?.id, repositoryId)
    assert.equal(candidate.head_repository?.id, repositoryId)
  }
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].name, jobName)
  assert.equal(jobs[0].status, 'completed')
  assert.equal(jobs[0].conclusion, 'success')
  assert.equal(jobs[0].run_attempt, 1)
  assert.equal(jobs[0].head_sha, request.revision)
  assert.equal(artifacts.length, 1)
  const [artifact] = artifacts
  assert.equal(artifact.name, `npm-name-reservation-${request.revision}-1`)
  assert.equal(artifact.expired, false)
  assert.ok(positiveId(artifact.id))
  assert.match(artifact.digest ?? '', /^sha256:[a-f0-9]{64}$/)
  assert.ok(artifact.size_in_bytes > 0 && artifact.size_in_bytes <= 1024 ** 2)
  for (const [key, value] of Object.entries({ id, repository_id: repositoryId, head_repository_id: repositoryId, head_sha: request.revision, head_branch: 'rc' })) {
    assert.equal(artifact.workflow_run?.[key], value)
  }
  const created = Date.parse(artifact.created_at)
  assert.ok(created >= Date.parse(selected.run_started_at) && created <= Date.parse(selected.updated_at))
  const response = await github.fetchApi(`${github.base}/actions/artifacts/${artifact.id}/zip`, { headers: github.headers, redirect: 'manual', signal: AbortSignal.timeout(30_000) })
  assert.equal(response.status, 302)
  let download
  try {
    const location = new URL(response.headers.get('location'))
    assert.ok(location.protocol === 'https:' && !location.username && !location.password)
    download = await github.fetchApi(location, { redirect: 'error', signal: AbortSignal.timeout(30_000) })
  } catch { throw new Error('Could not retrieve the signed GitHub canary artifact download') }
  assert.equal(download.status, 200)
  const chunks = []; let size = 0
  for await (const chunk of download.body) {
    size += chunk.length
    assert.ok(size <= artifact.size_in_bytes)
    chunks.push(Buffer.from(chunk))
  }
  const bytes = Buffer.concat(chunks)
  assert.equal(bytes.length, artifact.size_in_bytes)
  assert.equal(`sha256:${sha(bytes)}`, artifact.digest)
  const result = await run('python3', ['-c', readReceiptZIP], { input: bytes, extendEnv: false, env: { PATH: env.PATH }, timeout: 15_000 })
  return { receipt: JSON.parse(result.stdout), artifact: { id: artifact.id, digest: artifact.digest } }
}

export function checkCanaryReceipt(request, receipt) {
  const expected = reservationRequest({ selection: 'nuxt-canary', run: request.canaryRun, attempt: 1, revision: request.revision })
  assert.equal(receipt.schemaVersion, 1)
  assert.equal(receipt.mode, 'stage-only')
  assert.deepEqual(receipt.request, expected)
  assert.equal(receipt.complete, true)
  assert.equal(receipt.npmVersion, npmVersion)
  assert.equal(receipt.publicationPerformed, false)
  assert.equal(receipt.stageApprovalPerformed, false)
  assert.equal(receipt.stageRejectionPerformed, false)
  assert.equal(receipt.operations.length, 1)
  const [item] = receipt.operations
  assert.equal(item.name, canary)
  assert.equal(item.version, expected.version)
  assert.equal(item.state, 'verified')
  assert.match(item.stageId ?? '', uuid)
  assert.deepEqual(item.archive, archiveIdentity(reservationArchive(canary, expected.version)))
  assert.equal(item.evidence.stage.byteIdentical, true)
  assert.equal(item.evidence.stage.stageId, item.stageId)
  assert.equal(item.evidence.publicPlaceholder.npmProviderStub, true)
  assert.equal(item.evidence.publicPlaceholder.exactStagedManifestHTTPStatus, 404)
  return item
}

function assertStagePermission(request, confirm, env) {
  assert.ok(confirm === confirmations[request.selection], 'Use the exact confirmation for the selected names')
  for (const [key, value] of Object.entries({ GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REPOSITORY: repository, GITHUB_REPOSITORY_ID: String(repositoryId), GITHUB_SHA: request.revision, GITHUB_REF: 'refs/heads/rc',
    GITHUB_WORKFLOW_REF: `${repository}/${workflow}@refs/heads/rc`, GITHUB_RUN_ID: String(request.run), GITHUB_RUN_ATTEMPT: '1' })) {
    assert.ok(env[key] === value, `Unexpected GitHub execution context: ${key}`)
  }
  assert.ok(/^[A-Za-z0-9._-]{24,512}$/.test(env.NPM_PACKAGE_BOOTSTRAP_TOKEN ?? ''), 'Configure the existing scoped npm bootstrap credential')
}

function safeStageError(error) {
  // Never expose child output or its attached environment. Only retain known npm codes.
  const allowed = new Set(['E400', 'E401', 'E403', 'E404', 'E409', 'E429', 'EOTP', 'ENEEDAUTH', 'EUSAGE', 'EPRIVATE', 'ETIMEDOUT', 'ECONNRESET', 'E_STAGE_REQUIRED'])
  const code = error.stderr?.match(/(?:^|\n)npm error code ([A-Z0-9_]+)(?:\r?\n|$)/)?.[1]
  return { code: allowed.has(code) ? code : null, exitCode: Number.isSafeInteger(error.exitCode) ? error.exitCode : null, timedOut: error.timedOut === true }
}

function stageIdentifier(output, item) {
  let result
  try { result = JSON.parse(output) } catch { throw new Error('npm staging did not return valid JSON') }
  const entry = result?.[item.name]
  // Assertion payloads from authenticated npm output are intentionally omitted.
  assert.ok(entry?.name === item.name && entry?.version === item.version && uuid.test(entry?.stageId ?? ''), 'npm staging acknowledgment did not identify the requested package')
  return entry.stageId
}

export async function reserveNames(input, { output, stage = false, confirm = '', env = process.env, github = githubReader(env),
  fetchMetadata = fetch, run = execa, wait = pause } = {}) {
  const request = reservationRequest(input), anonymous = reader(fetchMetadata)
  if (stage) assertStagePermission(request, confirm, env)
  assert.ok(output, 'Use a fresh reservation output directory')
  await assertReleaseHeld(github)
  await mkdir(output, { mode: 0o700 })
  const receipt = { schemaVersion: 1, mode: stage ? 'stage-only' : 'dry-run', request, publicationPerformed: false,
    stageApprovalPerformed: false, stageRejectionPerformed: false, operations: [], complete: false }
  const receiptFile = join(output, 'reservation-receipt.json')
  await save(receiptFile, receipt)
  for (const name of request.names) {
    const bytes = reservationArchive(name, request.version), archive = await verifyReservationArchive(bytes, name, request.version, { run, env })
    const file = `${slug(name)}-${request.version}.tgz`
    await writeFile(join(output, file), bytes, { flag: 'wx', mode: 0o600 })
    receipt.operations.push({ name, version: request.version, file, archive, state: 'prepared' })
  }
  await save(receiptFile, receipt)
  const authenticated = stage ? reader(fetchMetadata, env.NPM_PACKAGE_BOOTSTRAP_TOKEN) : null
  await Promise.all(request.names.map(name => assertAbsent(name, request.version, anonymous, authenticated)))
  if (!stage) {
    receipt.complete = true
    await save(receiptFile, receipt)
    return receipt
  }
  if (request.canaryRun) {
    const previous = await readCanaryReceipt(request, github, run, env)
    const canaryItem = checkCanaryReceipt(request, previous.receipt)
    const current = await verifyStaged(canaryItem, { anonymous, authenticated, run, env, wait })
    receipt.canary = { run: request.canaryRun, artifact: previous.artifact, current }
    await save(receiptFile, receipt)
  }
  const session = await bootstrapNpmSession(env, { allowOidc: false })
  try {
    const { cleanup: _cleanup, ...options } = session
    let version
    try { version = await run('npm', ['--version'], { ...options, stdout: 'pipe', stderr: 'pipe', timeout: 15_000 }) }
    catch { throw new Error('Could not verify the pinned npm CLI in the isolated session') }
    assert.ok(version.stdout.trim() === npmVersion, 'Use the pinned npm 11.21.0')
    receipt.npmVersion = npmVersion
    for (const item of receipt.operations) {
      await assertReleaseHeld(github)
      await assertAbsent(item.name, item.version, anonymous, authenticated)
      assert.deepEqual(archiveIdentity(await readFile(join(output, item.file))), item.archive, 'Reservation archive changed')
      Object.assign(item, { state: 'attempted', attemptedAt: new Date().toISOString() })
      await save(receiptFile, receipt)
      let result
      try {
        result = await run('npm', ['stage', 'publish', resolve(output, item.file), '--tag', stageTag, '--ignore-scripts', '--no-provenance',
          '--access', 'public', '--registry', npmRegistry, '--fetch-retries=0', '--json'], { ...options, stdout: 'pipe', stderr: 'pipe', timeout: 90_000 })
      } catch (error) {
        item.error = safeStageError(error)
        await save(receiptFile, receipt)
        throw new Error('npm staging failed or was ambiguous; inspect the attempted receipt and registry state before further action')
      }
      item.stageId = stageIdentifier(result.stdout, item)
      item.state = 'submitted'
      await save(receiptFile, receipt)
      item.evidence = await verifyStaged(item, { anonymous, authenticated, run, env, wait })
      item.state = 'verified'
      await save(receiptFile, receipt)
    }
    receipt.complete = true
    await save(receiptFile, receipt)
    return receipt
  } finally { await session.cleanup() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = process.env, root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const revision = (await execa('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
  assert.equal((await execa('git', ['status', '--porcelain=v1', '--untracked-files=no'], { cwd: root })).stdout.trim(), '')
  const result = await reserveNames({ selection: env.RESERVATION_SELECTION, canaryRun: env.RESERVATION_CANARY_RUN,
    run: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT, revision }, { output: join(root, 'reservation-artifacts'),
    stage: env.RESERVATION_STAGE === 'true', confirm: env.RESERVATION_CONFIRM, env })
  console.log(JSON.stringify({ mode: result.mode, names: result.request.names, complete: result.complete, publicationPerformed: false }))
}
