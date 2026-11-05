import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { execa } from 'execa'
import { checkCanaryReceipt, confirmations, reservationArchive, reservationRequest, reserveNames, verifyReservationArchive } from './npm-name-reservation.mjs'

const name = '@master/css-nuxt', path = '@master%2fcss-nuxt', revision = 'a'.repeat(40)
const input = { selection: 'nuxt-canary', run: 123, attempt: 1, revision }, version = '0.0.0-reserve.123.1'
const stageId = 'f8e7a45b-7a5f-4f31-8e6d-9dd1c6ef38c0', token = 'npm_fixture_reservation_token_0123456789'
const stubVersion = '0.0.0-stage', description = 'Temporary package placeholder for staged publishing'
const tag = 'name-reservation'
const sha = (bytes, algorithm, encoding) => createHash(algorithm).update(bytes).digest(encoding)
const absent = () => new Response('{}', { status: 404 })
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'))
const github = { api: async route => {
  assert.equal(route, '/actions/workflows/release.yml')
  return { path: '.github/workflows/release.yml', state: 'disabled_manually' }
} }

function hosted(overrides = {}) {
  return { PATH: process.env.PATH, GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_REPOSITORY: 'master-co/css', GITHUB_REPOSITORY_ID: '434642460', GITHUB_SHA: revision, GITHUB_REF: 'refs/heads/rc',
    GITHUB_WORKFLOW_REF: 'master-co/css/.github/workflows/npm-name-reservation.yml@refs/heads/rc', GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1',
    NPM_PACKAGE_BOOTSTRAP_TOKEN: token, ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'never-forward', NODE_OPTIONS: 'never-forward', ...overrides }
}

async function providerArchive() {
  const { stdout } = await execa('python3', ['-c', String.raw`
import base64,io,json,sys,tarfile
name=sys.argv[1]
files={'package/package.json':json.dumps({'name':name,'version':'0.0.0-stage','stub':True,'description':'Temporary package placeholder for staged publishing'}),
       'package/README.md':'# Temporary Holding Version\n\nThis version is a temporary placeholder for this package. An operational version to replace this has been submitted for review and is awaiting a staged release.\n'}
buf=io.BytesIO()
with tarfile.open(fileobj=buf,mode='w:gz') as archive:
    directory=tarfile.TarInfo('package');directory.type=tarfile.DIRTYPE;archive.addfile(directory)
    for path,text in files.items():
        data=text.encode();entry=tarfile.TarInfo(path);entry.size=len(data);archive.addfile(entry,io.BytesIO(data))
print(base64.b64encode(buf.getvalue()).decode())
`, name])
  return Buffer.from(stdout, 'base64')
}

async function fixture(output, { preexisting = false, changed = false, formalTag = false, publicExact = false, failure = false, tagsEmpty = false,
  validating = () => false, placeholderReady = () => true, stalePlaceholderTags = () => false } = {}) {
  const stagedBytes = reservationArchive(name, version), placeholder = await providerArchive(), calls = [], observations = []
  const manifest = { name, version: stubVersion, description, dist: { fileCount: 2,
    integrity: `sha512-${sha(placeholder, 'sha512', 'base64')}`, shasum: sha(placeholder, 'sha1', 'hex'),
    tarball: 'https://registry.npmjs.org/@master/css-nuxt/-/css-nuxt-0.0.0-stage.tgz' } }
  const tags = formalTag ? { latest: '2.0.0' } : tagsEmpty ? {} : { latest: stubVersion }
  let submitted = false, session
  const stagedInfo = () => ({ id: stageId, packageName: name, version, tag, access: 'public', status: validating() ? 'validating' : 'staged',
    shasum: sha(stagedBytes, 'sha1', 'hex'), createdAt: '2026-11-05T07:00:00Z' })
  const fetchMetadata = async (url, options) => {
    const address = new URL(url), route = address.pathname, auth = options.headers.Authorization
    assert.equal(address.origin, 'https://registry.npmjs.org')
    assert.equal(options.method, 'GET')
    assert.equal(options.redirect, 'error')
    if (auth) assert.equal(auth, `Bearer ${token}`)
    observations.push({ route, auth: Boolean(auth) })
    if (route === '/-/stage') {
      assert.equal(auth, `Bearer ${token}`)
      assert.equal(address.searchParams.get('package'), name)
      return Response.json(submitted ? { total: 1, items: [stagedInfo()] } : { total: 0, items: [] })
    }
    if (!submitted) {
      if (preexisting && auth && route === `/${path}`) return Response.json({ name })
      return route.endsWith('/dist-tags') ? new Response('{}', { status: 401 }) : absent()
    }
    if (route === `/-/stage/${stageId}`) {
      assert.equal(auth, `Bearer ${token}`)
      return Response.json(stagedInfo())
    }
    if (route === `/-/stage/${stageId}/tarball`) {
      assert.equal(auth, `Bearer ${token}`)
      return new Response(changed ? Buffer.from('substituted') : stagedBytes)
    }
    assert.equal(auth, undefined)
    if (route === `/${path}`) return Response.json({ name, 'dist-tags': stalePlaceholderTags() ? {} : tags,
      versions: { [stubVersion]: { ...manifest, stub: true } } })
    if (route === `/${path}/${stubVersion}`) return Response.json(manifest)
    if (route.endsWith('/dist-tags')) return Response.json(tags)
    if (route.endsWith(`-${stubVersion}.tgz`)) return placeholderReady() ? new Response(placeholder) : absent()
    if (publicExact && route.endsWith(`/${version}`)) return Response.json({ name, version })
    return absent()
  }
  const run = async (command, args, options) => {
    if (command === 'python3') return execa(command, args, options)
    assert.equal(command, 'npm')
    if (args[0] === '--version') return { stdout: '11.21.0' }
    calls.push(args); session = options.cwd
    assert.equal(options.env.NPM_PACKAGE_BOOTSTRAP_TOKEN, token)
    for (const key of ['ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'NODE_OPTIONS', 'GITHUB_TOKEN']) assert.equal(options.env[key], undefined)
    assert.equal(options.extendEnv, false)
    assert.deepEqual(args, ['stage', 'publish', join(output, `css-nuxt-${version}.tgz`), '--tag', tag, '--ignore-scripts', '--no-provenance', '--access', 'public',
      '--registry', 'https://registry.npmjs.org/', '--fetch-retries=0', '--json'])
    assert.equal((await readJSON(join(output, 'reservation-receipt.json'))).operations[0].state, 'attempted')
    if (failure) throw Object.assign(new Error(token), { stderr: `npm error code E403\n${token}`, stdout: token, exitCode: 1 })
    submitted = true
    return { stdout: JSON.stringify({ [name]: { name, version, stageId } }) }
  }
  return { calls, observations, options: { output, stage: true, confirm: confirmations['nuxt-canary'], env: hosted(), github, fetchMetadata, run, wait: async () => {} },
    getSession: () => session }
}

test('only exact selections and first attempts produce deterministic two-file archives', async () => {
  assert.deepEqual(reservationRequest(input).names, [name])
  assert.throws(() => reservationRequest({ ...input, attempt: 2 }), /never rerun/)
  assert.throws(() => reservationRequest({ ...input, selection: '@master/css-next' }))
  assert.throws(() => reservationRequest({ ...input, selection: 'remaining-four' }))
  const second = reservationRequest({ ...input, selection: 'remaining-four', canaryRun: 22 })
  assert.deepEqual(second.names, ['@master/css-svelte', '@master/css-svelte-addon', '@master/css-vscode', '@master/css-webpack'])
  const bytes = reservationArchive(name, version)
  assert.deepEqual(bytes, reservationArchive(name, version))
  assert.ok((await verifyReservationArchive(bytes, name, version)).bytes < 1024)
  await assert.rejects(verifyReservationArchive(bytes, '@master/css-webpack', version))
})

test('dry run uses no npm identity or command and checks public absence', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-dry-'))
  try {
    const f = await fixture(join(root, 'evidence'))
    const receipt = await reserveNames(input, { ...f.options, stage: false, env: { PATH: process.env.PATH } })
    assert.equal(receipt.mode, 'dry-run')
    assert.equal(receipt.operations[0].state, 'prepared')
    assert.equal(receipt.complete, true)
    assert.ok(f.observations.every(row => !row.auth))
    assert.equal(f.calls.length, 0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('one staged Nuxt archive is byte verified and public routes expose only the provider placeholder', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-success-'))
  try {
    for (const tagsEmpty of [false, true]) {
      const f = await fixture(join(root, String(tagsEmpty)), { tagsEmpty })
      const receipt = await reserveNames(input, f.options), [item] = receipt.operations
      assert.equal(receipt.complete, true)
      assert.equal(receipt.publicationPerformed, false)
      assert.equal(receipt.stageApprovalPerformed, false)
      assert.equal(receipt.stageRejectionPerformed, false)
      assert.equal(f.calls.length, 1)
      assert.equal(item.state, 'verified')
      assert.equal(item.stageId, stageId)
      assert.equal(item.evidence.stage.byteIdentical, true)
      assert.deepEqual(item.evidence.publicPlaceholder.tags, tagsEmpty ? {} : { latest: stubVersion })
      assert.equal(item.evidence.publicPlaceholder.exactStagedTarballHTTPStatus, 404)
      await assert.rejects(stat(f.getSession()), { code: 'ENOENT' })
      const remaining = reservationRequest({ ...input, run: 124, selection: 'remaining-four', canaryRun: 123 })
      assert.deepEqual(checkCanaryReceipt(remaining, receipt), item)
      assert.throws(() => checkCanaryReceipt({ ...remaining, canaryRun: 122 }, receipt))
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('existing private names, unapproved writes, unsupported runners and active Release stop before staging', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-preflight-'))
  try {
    const invalid = [{ preexisting: true }, { options: { confirm: 'yes' } }, { options: { env: hosted({ GITHUB_REF: 'refs/heads/main' }) } },
      { options: { github: { api: async () => ({ path: '.github/workflows/release.yml', state: 'active' }) } } }]
    for (const [i, scenario] of invalid.entries()) {
      const f = await fixture(join(root, String(i)), scenario)
      await assert.rejects(reserveNames(input, { ...f.options, ...scenario.options }))
      assert.equal(f.calls.length, 0)
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('validating provider status is polled without resubmission, up to the documented scan window', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-scan-'))
  try {
    let elapsed = 0, missingTarReads = 0
    const f = await fixture(join(root, 'evidence'), { validating: () => elapsed < 15 * 60_000, stalePlaceholderTags: () => elapsed === 0,
      placeholderReady: () => { if (elapsed >= 3000) return true; missingTarReads++; return false } })
    const receipt = await reserveNames(input, { ...f.options, wait: async delay => { elapsed += delay } })
    assert.ok(elapsed >= 15 * 60_000)
    assert.equal(missingTarReads, 1)
    assert.equal(f.calls.length, 1)
    assert.equal(receipt.operations[0].evidence.stage.status, 'staged')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('ambiguous stage calls and wrong public or private bytes retain exact receipts without retrying', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-uncertain-'))
  try {
    for (const scenario of ['changed', 'formalTag', 'publicExact', 'failure']) {
      const output = join(root, scenario), f = await fixture(output, { [scenario]: true })
      await assert.rejects(reserveNames(input, f.options), error => !error.message.includes(token))
      assert.equal(f.calls.length, 1)
      const file = join(output, 'reservation-receipt.json'), receipt = await readJSON(file), [item] = receipt.operations
      assert.equal(receipt.complete, false)
      assert.equal(item.state, scenario === 'failure' ? 'attempted' : 'submitted')
      if (scenario === 'failure') assert.deepEqual(item.error, { code: 'E403', exitCode: 1, timedOut: false })
      else assert.equal(item.stageId, stageId)
      assert.ok(!(await readFile(file, 'utf8')).includes(token))
      await assert.rejects(stat(f.getSession()), { code: 'ENOENT' })
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('reservation workflow defaults to credential-free dry run and uses the existing concurrency lock without OIDC', async () => {
  const path = new URL('../.github/workflows/npm-name-reservation.yml', import.meta.url).pathname
  const result = await execa('bun', ['--eval', 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(process.argv[1]).text())))', path])
  const config = JSON.parse(result.stdout), job = config.jobs.reserve
  assert.deepEqual(Object.keys(config.on), ['workflow_dispatch'])
  assert.equal(config.on.workflow_dispatch.inputs.stage.default, false)
  assert.equal(config.on.workflow_dispatch.inputs.selection.default, 'nuxt-canary')
  assert.equal(config.concurrency.group, 'master-css-npm-package-bootstrap')
  assert.equal(config.concurrency['cancel-in-progress'], false)
  assert.equal(job.permissions['id-token'], undefined)
  const credential = job.steps.filter(step => step.env?.NPM_PACKAGE_BOOTSTRAP_TOKEN)
  assert.equal(credential.length, 1)
  assert.match(credential[0].run, /npm-name-reservation\.mjs/)
  assert.match(credential[0].env.NPM_PACKAGE_BOOTSTRAP_TOKEN, /inputs\.stage/)
  assert.equal(job.steps.at(-1).if, '${{ always() }}')
})

test('remaining-four requires an authenticated canary artifact and does not reveal a malformed signed Location', async () => {
  const root = await mkdtemp(join(tmpdir(), 'npm-reservation-canary-artifact-'))
  const signed = 'https://example.invalid:bad/signed?marker=private-signed-query', repo = { id: 434642460 }
  const workflow = '.github/workflows/npm-name-reservation.yml'
  const run = { id: 122, run_attempt: 1, path: workflow, workflow_id: 10, head_sha: revision, head_branch: 'rc', event: 'workflow_dispatch',
    status: 'completed', conclusion: 'success', repository: repo, head_repository: repo,
    run_started_at: '2026-11-05T07:00:00Z', updated_at: '2026-11-05T07:20:00Z' }
  const artifact = { id: 23, name: `npm-name-reservation-${revision}-1`, expired: false, digest: 'sha256:' + 'b'.repeat(64), size_in_bytes: 34,
    created_at: '2026-11-05T07:19:00Z', workflow_run: { id: 122, repository_id: repo.id, head_repository_id: repo.id, head_sha: revision, head_branch: 'rc' } }
  const gh = { api: async route => route.endsWith('/release.yml') ? github.api(route) : route.endsWith('/npm-name-reservation.yml') ? { id: 10, path: workflow } : run,
    pages: async (_route, key) => key === 'jobs' ? [{ name: 'Reserve npm names without releasing staged contents', status: 'completed', conclusion: 'success', run_attempt: 1, head_sha: revision }] : [artifact],
    base: 'https://api.github.com/repos/master-co/css', headers: {}, fetchApi: async () => new Response(null, { status: 302, headers: { location: signed } }) }
  try {
    let npmCalls = 0
    await assert.rejects(reserveNames({ ...input, selection: 'remaining-four', canaryRun: 122 }, { output: join(root, 'evidence'), stage: true,
      confirm: confirmations['remaining-four'], env: hosted(), github: gh,
      fetchMetadata: async url => new URL(url).pathname === '/-/stage' ? Response.json({ total: 0, items: [] }) : absent(),
      run: async (command, args, options) => { if (command === 'npm') npmCalls++; return execa(command, args, options) } }),
    error => error.message === 'Could not retrieve the signed GitHub canary artifact download' && !error.cause && !error.input)
    assert.equal(npmCalls, 0)
  } finally { await rm(root, { recursive: true, force: true }) }
})
