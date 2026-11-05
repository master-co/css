import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { execa } from 'execa'
import { bootstrapPackages, bootstrapTag, bootstrapConfirmation, bootstrapRequest, verifyBootstrapSource, githubReader, planBootstrap,
  packBootstrap, prepareBootstrap, publishBootstrap, assertBootstrapPublication, extractNativePython,
  cleanupFailedBootstrapLatest, cleanupConfirmation, verifyFailedBootstrapEvidence, verifyHistoricalBootstrapStatement } from './npm-package-bootstrap.mjs'

const revision = 'a'.repeat(40), repo = { id: 434642460, full_name: 'master-co/css' }
const targets = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-arm64-musl', 'linux-x64-gnu', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc']
const hosts = ['alpine-arm64', 'alpine-x64', 'darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-arm64', 'win32-x64']
const request = bootstrapRequest({ runId: 123, attempt: 2, revision })
const token = 'npm_fixture_bootstrap_secret_123456789'
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'))
const absent = async () => new Response('{}', { status: 404 })

function evidence() {
  const run = { id: 123, run_attempt: 2, workflow_id: 10, path: '.github/workflows/ci.yml', head_sha: revision, head_branch: 'rc',
    event: 'workflow_dispatch', status: 'completed', conclusion: 'success', repository: repo, head_repository: repo,
    run_started_at: '2026-11-05T00:00:00Z', updated_at: '2026-11-05T01:00:00Z' }
  const names = ['required', ...['preflight', 'quality-linux', 'rust-quality', 'compat-macos', 'compat-windows', 'e2e-linux'].map(n => `validation / ${n}`),
    ...targets.map(t => `validation / native-binding-${t}`), ...targets.map(t => `validation / editor-release-evidence / Build editor native target binding-${t}`),
    'validation / editor-release-evidence / Package both publisher identities without versioning or publishing',
    ...hosts.map(t => `validation / editor-release-evidence / Verify installed editor artifact ${t}`),
    'validation / editor-release-evidence / Require every editor artifact proof']
  const artifacts = [...targets.map(t => `mastercss-binding-${t}`), 'editor-vsix', ...hosts.map(t => `editor-proof-${t}`)].map((name, index) => ({
    name, id: index + 1, expired: false, digest: 'sha256:' + 'b'.repeat(64), created_at: '2026-11-05T00:30:00Z',
    workflow_run: { id: 123, repository_id: repo.id, head_repository_id: repo.id, head_sha: revision, head_branch: 'rc' }
  }))
  return { workflow: { id: 10, path: '.github/workflows/ci.yml' }, releaseWorkflow: { path: '.github/workflows/release.yml', state: 'disabled_manually' },
    run, latest: structuredClone(run), jobs: names.map(name => ({ name, status: 'completed', conclusion: 'success' })), artifacts }
}

function githubFixture(data = evidence()) {
  return { api: async route => {
    if (route === '/actions/workflows/ci.yml') return data.workflow
    if (route === '/actions/workflows/release.yml') return data.releaseWorkflow
    if (route.endsWith('/attempts/2')) return data.run
    if (route === '/actions/runs/123') return data.latest
    throw new Error(`Unexpected fixture route ${route}`)
  }, pages: async (_route, key) => data[key] }
}

function publicationEnv() {
  return { ...process.env, GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REPOSITORY: repo.full_name,
    GITHUB_REPOSITORY_ID: String(repo.id), GITHUB_SHA: revision, GITHUB_REF: 'refs/heads/rc',
    GITHUB_WORKFLOW_REF: 'master-co/css/.github/workflows/npm-package-bootstrap.yml@refs/heads/rc',
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example.test/oidc', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture-oidc-request', NPM_PACKAGE_BOOTSTRAP_TOKEN: token }
}

async function preparedFixture(pack = true) {
  const root = await mkdtemp(join(tmpdir(), 'master-bootstrap-test-')), output = join(root, 'evidence')
  await mkdir(output)
  await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }))
  for (const [name, packageRoot] of Object.entries({ ...bootstrapPackages, '@master/css': 'packages/css' })) {
    await mkdir(join(root, packageRoot, 'dist'), { recursive: true })
    await writeFile(join(root, packageRoot, 'dist/index.js'), 'export const value = 1\n')
    await writeFile(join(root, packageRoot, 'package.json'), JSON.stringify({ name, version: name === '@master/css-vscode' ? '2.0.37' : '0.0.0',
      files: ['dist'], exports: { '.': './dist/index.js' }, publishConfig: { access: 'public', provenance: true },
      repository: { type: 'git', url: 'https://github.com/master-co/css.git' }, ...(name === '@master/css' ? {} : { dependencies: { '@master/css': 'workspace:*' } }) }))
  }
  const data = evidence(), github = githubFixture(data), plan = await planBootstrap(request, { github, fetchMetadata: absent })
  const planFile = join(output, 'plan.json')
  await writeFile(planFile, JSON.stringify(plan))
  const prepared = pack ? await packBootstrap(root, output, plan) : undefined
  return { root, output, plan, planFile, prepared, github, data }
}

test('plan accepts only the complete same-HEAD manual release candidate, never a plain/superseded/fork CI run', () => {
  assert.equal(verifyBootstrapSource(request, evidence()).length, 8)
  for (const mutate of [
    e => { e.run.head_sha = 'c'.repeat(40) }, e => { e.run.head_repository = { ...repo, id: 1 } },
    e => { e.workflow.path = '.github/workflows/release.yml' }, e => { e.run.path = '.github/workflows/other.yml' },
    e => { e.run.event = 'pull_request' }, e => { e.run.conclusion = 'failure' }, e => { e.latest.run_attempt = 3 },
    e => { e.jobs[0].conclusion = 'skipped' }, e => { e.jobs.pop() }, e => { e.artifacts.pop() },
    e => { e.artifacts[0].expired = true }, e => { e.artifacts[0].digest = undefined },
    e => { e.artifacts[0].workflow_run.head_sha = 'd'.repeat(40) }, e => { e.artifacts[0].created_at = '2026-11-04T00:30:00Z' },
    e => { e.artifacts.push(e.artifacts[0]) }, e => { e.releaseWorkflow.state = 'active' }
  ]) { const data = evidence(); mutate(data); assert.throws(() => verifyBootstrapSource(request, data)) }
  for (const value of ['2.0.0', '0', '-1', '1;echo unsafe', Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => bootstrapRequest({ runId: value, attempt: 1, revision }))
  assert.equal(request.version, '0.0.0-bootstrap.123.2')
  assert.equal(request.tag, 'bootstrap')
})

test('GitHub evidence pagination is complete and read credentials never go in URLs', async () => {
  const calls = []
  const github = githubReader({ GITHUB_TOKEN: 'fixture-github-read-token' }, async (url, options) => {
    calls.push({ url, options })
    assert.ok(!url.includes('fixture-'))
    assert.equal(options.headers.Authorization, 'Bearer fixture-github-read-token')
    return Response.json({ jobs: url.endsWith('page=1') ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 101 }] })
  })
  assert.equal((await github.pages('/actions/runs/123/attempts/2/jobs', 'jobs')).length, 101)
  assert.equal(calls.length, 2)
})

test('default plan needs no npm credential and rejects any existing or unavailable name before preparing files', async () => {
  let reads = 0
  const plan = await planBootstrap(request, { github: githubFixture(), fetchMetadata: async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined); reads++; return absent()
  } })
  assert.equal(reads, 6)
  assert.equal(plan.ownershipVerified, false)
  assert.equal(plan.usableReleaseCohort, false)
  assert.equal(plan.publicationPerformed, false)
  for (const status of [200, 401, 403, 429, 500]) await assert.rejects(planBootstrap(request, { github: githubFixture(), fetchMetadata: async () => new Response('{}', { status }) }), /absent name/)
})

test('real standard release preparation packs exactly the six allowed names at an inactive version without touching source manifests', async () => {
  const f = await preparedFixture()
  try {
    assert.deepEqual(f.prepared.packages.map(p => p.name), Object.keys(bootstrapPackages))
    assert.equal((await readdir(join(f.output, 'packages'))).length, 6)
    for (const p of f.prepared.packages) {
      assert.match(p.integrity, /^sha512-/)
      assert.equal(p.provenance, true)
      const { packedManifest } = await import('./semantic-release-workspace.mjs')
      const manifest = packedManifest(await readFile(join(f.output, p.file)))
      assert.equal(manifest.version, request.version)
      assert.equal(manifest.gitHead, revision)
      assert.equal(manifest.dependencies['@master/css'], request.version)
    }
    assert.equal((await readJSON(join(f.root, 'packages/vscode/package.json'))).version, '2.0.37')
    await assert.rejects(stat(join(f.output, 'workspace')), { code: 'ENOENT' })
    const result = await publishBootstrap(f.planFile, { github: f.github, fetchMetadata: absent, env: {}, run: () => { throw new Error('dry run invoked a command') } })
    assert.equal(result.mode, 'dry-run')
    assert.deepEqual(result.operations, [])
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('archive tampering and a forged formal version are rejected before any npm command', async () => {
  const f = await preparedFixture()
  try {
    await writeFile(join(f.output, f.prepared.packages[0].file), 'tampered')
    await assert.rejects(publishBootstrap(f.planFile, { github: f.github, fetchMetadata: absent }), /archive changed/)
    const plan = { ...f.plan, version: '2.0.0' }
    await writeFile(f.planFile, JSON.stringify(plan))
    await assert.rejects(publishBootstrap(f.planFile, { github: f.github, fetchMetadata: absent }), /0\.0\.0-bootstrap/)
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('a package cannot override the bootstrap tag or claim a different provenance repository', async () => {
  for (const field of ['tag', 'repository']) {
    const f = await preparedFixture(false)
    try {
      const file = join(f.root, 'packages/next/package.json'), manifest = await readJSON(file)
      if (field === 'tag') manifest.tag = 'latest'
      else manifest.repository.url = 'https://github.com/another/repository.git'
      await writeFile(file, JSON.stringify(manifest))
      await assert.rejects(packBootstrap(f.root, f.output, f.plan))
    } finally { await rm(f.root, { recursive: true, force: true }) }
  }
})

test('publication needs all explicit guards, a hosted provenance identity and the dedicated credential', () => {
  const options = { publish: true, confirm: bootstrapConfirmation }
  assert.doesNotThrow(() => assertBootstrapPublication(publicationEnv(), request, options))
  for (const key of ['GITHUB_ACTIONS', 'RUNNER_ENVIRONMENT', 'GITHUB_EVENT_NAME', 'GITHUB_REPOSITORY', 'GITHUB_REPOSITORY_ID', 'GITHUB_SHA', 'GITHUB_REF', 'GITHUB_WORKFLOW_REF', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'NPM_PACKAGE_BOOTSTRAP_TOKEN']) {
    const env = publicationEnv(); env[key] = ''; assert.throws(() => assertBootstrapPublication(env, request, options))
  }
  for (const options of [{ publish: false, confirm: bootstrapConfirmation }, { publish: true, confirm: 'yes' }]) assert.throws(() => assertBootstrapPublication(publicationEnv(), request, options))
  assert.throws(() => assertBootstrapPublication({ ...publicationEnv(), NPM_PACKAGE_BOOTSTRAP_TOKEN: token + '\nregistry=evil' }, request, options))
})

test('uncaught invalid credential errors never expose the raw or escaped token', async () => {
  const invalidToken = `${token}'\n\t\u001b[31mcredential-end`
  const source = `import { assertBootstrapPublication, bootstrapConfirmation } from ${JSON.stringify(new URL('./npm-package-bootstrap.mjs', import.meta.url).href)};
assertBootstrapPublication(process.env, { revision: process.env.GITHUB_SHA }, { publish: true, confirm: bootstrapConfirmation })`
  const result = await execa(process.execPath, ['--input-type=module', '--eval', source], {
    env: { ...publicationEnv(), NPM_PACKAGE_BOOTSTRAP_TOKEN: invalidToken }, reject: false, extendEnv: false, preferLocal: false,
  })
  assert.notEqual(result.exitCode, 0)
  const output = result.stdout + result.stderr
  assert.match(output, /Configure the separate bootstrap credential without whitespace/)
  for (const secret of [invalidToken, JSON.stringify(invalidToken).slice(1, -1), token]) assert.ok(!output.includes(secret), 'Credential appeared in uncaught child output')
})

test('authenticated absence check blocks an existing private package hidden from public metadata', async () => {
  const f = await preparedFixture()
  try {
    await assert.rejects(publishBootstrap(f.planFile, { publish: true, confirm: bootstrapConfirmation, env: publicationEnv(), github: f.github,
      fetchMetadata: async (_url, options) => options.headers.Authorization ? Response.json({ private: true }) : absent(),
      run: () => { throw new Error('must not publish an existing name') } }), /HTTP 200/)
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('controlled publish retains exact archives/provenance receipts, isolates credentials, and never promotes tags', async () => {
  const f = await preparedFixture(), registry = new Map(), calls = [], sessions = []
  const env = { ...publicationEnv(), GITHUB_TOKEN: 'must-not-reach-npm', NPM_TOKEN: 'poison', NODE_OPTIONS: '--require poison', npm_config_registry: 'https://evil.test' }
  try {
    const result = await publishBootstrap(f.planFile, { publish: true, confirm: bootstrapConfirmation, env, github: f.github,
      fetchMetadata: async url => {
        const segments = new URL(url).pathname.split('/').filter(Boolean)
        const last = segments.at(-1)
        const name = decodeURIComponent(segments.length === 1 ? last : segments.at(-2))
        const value = registry.get(name)
        if (!value) return absent()
        return Response.json(last === 'dist-tags' ? value['dist-tags'] : value.versions[last])
      },
      run: async (command, args, options) => {
        calls.push(args); sessions.push(options.cwd)
        assert.equal(command, 'npm'); assert.equal(args[0], 'publish'); assert.equal(args[args.indexOf('--tag') + 1], bootstrapTag)
        assert.ok(args.includes('--provenance')); assert.equal(args[args.indexOf('--access') + 1], 'public')
        assert.equal(options.extendEnv, false); assert.equal(options.preferLocal, false)
        for (const key of ['GITHUB_TOKEN', 'NPM_TOKEN', 'NODE_OPTIONS', 'npm_config_registry']) assert.equal(options.env[key], undefined)
        assert.equal(options.env.NPM_PACKAGE_BOOTSTRAP_TOKEN, token)
        const config = await readFile(options.env.NPM_CONFIG_USERCONFIG, 'utf8')
        assert.ok(config.includes('${NPM_PACKAGE_BOOTSTRAP_TOKEN}')); assert.ok(!config.includes(token))
        assert.equal((await stat(options.env.NPM_CONFIG_USERCONFIG)).mode & 0o777, 0o600)
        const p = f.prepared.packages.find(p => args[1] === join(f.output, p.file))
        registry.set(p.name, { versions: { [request.version]: { name: p.name, version: request.version, gitHead: revision,
          dist: { integrity: p.integrity, attestations: { url: 'https://registry.npmjs.org/fixture-attestation' }, tarball: 'https://registry.npmjs.org/fixture.tgz' } } }, 'dist-tags': { bootstrap: request.version } })
        return { stdout: 'discarded', stderr: '' }
      } })
    assert.equal(calls.length, 6); assert.equal(result.complete, true)
    assert.ok(result.operations.every(op => op.state === 'verified' && op.attestations.url))
    assert.ok(!(await readFile(join(f.output, 'publication-receipt.json'), 'utf8')).includes(token))
    for (const cwd of sessions) await assert.rejects(stat(cwd), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('a failed/ambiguous upload retains an attempted receipt, suppresses credential-bearing errors and cleans npmrc', async () => {
  const f = await preparedFixture(); let session
  try {
    await assert.rejects(publishBootstrap(f.planFile, { publish: true, confirm: bootstrapConfirmation, env: publicationEnv(), github: f.github, fetchMetadata: absent,
      run: async (_command, _args, options) => { session = options.cwd; throw new Error(token) } }), error => !error.message.includes(token) && /Credential-bearing output was discarded/.test(error.message))
    const receipt = await readJSON(join(f.output, 'publication-receipt.json'))
    assert.equal(receipt.operations.length, 1)
    assert.equal(receipt.operations[0].state, 'attempted')
    assert.equal(receipt.publicationPerformed, null)
    await assert.rejects(stat(session), { code: 'ENOENT' })
  } finally { await rm(f.root, { recursive: true, force: true }) }
})

test('native extraction rejects traversal, symlinks, unexpected files and wrong target manifests without extracting', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-bootstrap-zip-'))
  try {
    for (const defect of ['none', 'traversal', 'symlink', 'extra', 'target']) {
      const zip = join(root, defect + '.zip'), dest = join(root, defect)
      execFileSync('python3', ['-c', String.raw`
import json,sys,zipfile
file,defect=sys.argv[1:]
with zipfile.ZipFile(file,'w') as z:
 z.writestr('package.json',json.dumps({'name':'@master/css-binding-'+('wrong' if defect=='target' else 'linux-x64-gnu')}))
 z.writestr('mcss','binary')
 entry=zipfile.ZipInfo('mastercss.node')
 if defect=='symlink':entry.external_attr=0o120777<<16
 z.writestr(entry,'addon')
 if defect in ('traversal','extra'):z.writestr('../escape' if defect=='traversal' else 'unexpected','bad')
`, zip, defect])
      const operation = () => execa('python3', ['-c', extractNativePython, zip, dest, 'linux-x64-gnu'])
      if (defect === 'none') { await operation(); assert.equal((await readdir(dest)).length, 3) }
      else { await assert.rejects(operation()); await assert.rejects(stat(dest), { code: 'ENOENT' }) }
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('native ZIP digests are checked before extraction/build and all eight verified targets feed standard assembly and build', async () => {
  for (const corrupt of [true, false]) {
    const f = await preparedFixture(false), bodies = new Map(), calls = []
    try {
      const downloads = join(f.root, 'downloads'); await mkdir(downloads)
      execFileSync('python3', ['-c', String.raw`
import json,pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1])
for target in json.loads(sys.argv[2]):
 with zipfile.ZipFile(root/(target+'.zip'),'w') as z:
  z.writestr('package.json',json.dumps({'name':'@master/css-binding-'+target}))
  z.writestr('mastercss.node','addon')
  z.writestr('mcss.exe' if target.startswith('win32-') else 'mcss','executable')
`, downloads, JSON.stringify(targets)])
      for (const artifact of f.plan.evidence.nativeArtifacts) {
        const target = artifact.name.slice('mastercss-binding-'.length), bytes = await readFile(join(downloads, target + '.zip'))
        artifact.digest = 'sha256:' + createHash('sha256').update(bytes).digest('hex')
        bodies.set(artifact.id, bytes)
      }
      await writeFile(f.planFile, JSON.stringify(f.plan))
      const github = { ...f.github, base: 'https://api.github.com/repos/master-co/css', headers: { Authorization: 'Bearer fixture-read-only' },
        fetchApi: async (url, options) => {
          if (String(url).includes('api.github.com')) {
            assert.equal(options.headers.Authorization, 'Bearer fixture-read-only')
            return new Response('', { status: 302, headers: { location: `https://blob.example.test/${String(url).split('/').at(-2)}` } })
          }
          assert.equal(options.headers, undefined, 'never forward GitHub token to storage')
          const bytes = bodies.get(Number(String(url).split('/').at(-1)))
          return new Response(corrupt ? Buffer.from('tampered ZIP') : bytes)
        } }
      const run = async (command, args, options) => {
        calls.push({ command, args })
        if (command === 'git') return { stdout: args[0] === 'rev-parse' ? revision : '' }
        if (command === 'python3') return execa(command, args, options)
        if (command === 'cargo') {
          assert.equal((await readdir(join(f.output, 'native'))).length, 8)
          assert.deepEqual(args.slice(0, 2), ['xtask', 'assemble-native-release'])
          return { stdout: '' }
        }
        assert.equal(command, 'bun'); assert.deepEqual(args, ['run', 'build'])
        return { stdout: '' }
      }
      const operation = prepareBootstrap(f.root, f.planFile, { github, fetchMetadata: absent, run })
      if (corrupt) {
        await assert.rejects(operation, /ZIP differs/)
        assert.ok(calls.every(call => call.command === 'git'))
      } else {
        const result = await operation
        assert.equal(result.packages.length, 6)
        assert.equal(calls.filter(call => call.command === 'python3').length, 8)
        assert.deepEqual(calls.filter(call => ['cargo', 'bun'].includes(call.command)).map(call => call.command), ['cargo', 'bun', 'cargo'])
        assert.ok(calls.find(call => call.args.includes('--verify-staged')))
      }
    } finally { await rm(f.root, { recursive: true, force: true }) }
  }
})

test('workflow defaults to dry run and never exposes the bootstrap credential to build/plan or ordinary release', async () => {
  const source = new URL('../.github/workflows/npm-package-bootstrap.yml', import.meta.url).pathname
  const workflow = JSON.parse((await execa('bun', ['--eval', 'console.log(JSON.stringify(Bun.YAML.parse(await Bun.file(process.argv[1]).text())))', source])).stdout)
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch'])
  assert.equal(workflow.on.workflow_dispatch.inputs.publish.default, false)
  assert.equal(workflow.jobs.bootstrap['runs-on'], 'ubuntu-24.04')
  assert.equal(workflow.jobs.bootstrap.permissions['id-token'], 'write')
  const credentialSteps = workflow.jobs.bootstrap.steps.filter(step => step.env?.NPM_PACKAGE_BOOTSTRAP_TOKEN)
  assert.equal(credentialSteps.length, 1)
  assert.match(credentialSteps[0].run, / publish --plan /)
  assert.match(credentialSteps[0].env.NPM_PACKAGE_BOOTSTRAP_TOKEN, /inputs\.publish/)
  assert.equal(workflow.jobs.bootstrap.steps.at(-1).if, '${{ always() }}')
  assert.equal(workflow.on.workflow_dispatch.inputs.cleanup_failed_c5_latest.default, false)
  assert.match(workflow.jobs.bootstrap.if, /!inputs\.cleanup_failed_c5_latest/)
  assert.equal(workflow.jobs.cleanup.permissions['id-token'], undefined)
  assert.match(workflow.jobs.cleanup.if, /&& inputs\.cleanup_failed_c5_latest/)
  const [cleanupStep, ...other] = workflow.jobs.cleanup.steps.filter(step => step.env?.NPM_PACKAGE_BOOTSTRAP_TOKEN)
  assert.equal(other.length, 0)
  assert.match(cleanupStep.run, /cleanup-failed-c5-latest/)
  assert.ok(cleanupStep.env.NPM_PACKAGE_BOOTSTRAP_TOKEN.includes(`!inputs.publish && inputs.confirm == '${cleanupConfirmation}'`))
  assert.equal(workflow.jobs.cleanup.steps.at(-1).if, '${{ always() }}')
})

const oldName = '@master/css-next', oldVersion = '0.0.0-bootstrap.41977322027.1'
const oldRevision = '441516cfe59171a75ae6e25049ebb13bbe093e7d'
const oldIntegrity = 'sha512-I4eb91M3tTfSivpwwFZTddmE3s9ODme6H4+Yjph5xi9GuVUd7IG0JMViVQ4CTtoeAjxHeLXczLQA/nV/90f7ww=='
const oldWorkflow = '.github/workflows/npm-package-bootstrap.yml'
const registryName = '@master%2fcss-next', latestTags = { bootstrap: oldVersion, latest: oldVersion }, onlyBootstrap = { bootstrap: oldVersion }

test('C5 cleanup selects only the original unsuccessful run, failed publishing job and provider ZIP', () => {
  const run = { id: 41983776353, run_attempt: 1, workflow_id: 407567928, path: oldWorkflow, head_sha: oldRevision, head_branch: 'rc',
    event: 'workflow_dispatch', status: 'completed', conclusion: 'failure', repository: repo, head_repository: repo,
    run_started_at: '2026-11-05T06:56:34Z', updated_at: '2026-11-05T07:04:04Z' }
  const original = { workflow: { id: run.workflow_id, path: oldWorkflow }, releaseWorkflow: { path: '.github/workflows/release.yml', state: 'disabled_manually' },
    run, latest: structuredClone(run), jobs: [{ id: 127099659562, run_id: run.id, run_attempt: 1, head_sha: oldRevision,
      name: 'bootstrap', status: 'completed', conclusion: 'failure', steps: [
        { name: 'Dry-run or explicitly publish the reviewed six archives', status: 'completed', conclusion: 'failure' },
        { name: 'Retain original archives and source/integrity/provenance receipts even after failure', status: 'completed', conclusion: 'success' }
      ] }], artifact: { id: 13395446596, name: `npm-package-bootstrap-${oldRevision}-1`, size_in_bytes: 144409301, expired: false,
      digest: 'sha256:7c828ddc73f1dfb5049455bd3d2c6d8412099d61d3086f9c816fed0bc288933e', created_at: '2026-11-05T07:04:01Z',
      workflow_run: { id: run.id, repository_id: repo.id, head_repository_id: repo.id, head_sha: oldRevision, head_branch: 'rc' } } }
  verifyFailedBootstrapEvidence(original)
  for (const edit of [d => { d.latest.run_attempt++ }, d => { d.run.conclusion = 'success' }, d => { d.jobs[0].steps[0].conclusion = 'success' },
    d => { d.artifact.digest += '0' }, d => { d.artifact.expired = true }, d => { d.releaseWorkflow.state = 'active' }]) {
    const data = structuredClone(original); edit(data)
    assert.throws(() => verifyFailedBootstrapEvidence(data))
  }
})

test('C5 provenance binds the archived digest and exact failed run invocation', () => {
  const source = 'https://github.com/master-co/css', ref = 'refs/heads/rc', predicateType = 'https://slsa.dev/provenance/v1'
  const original = { _type: 'https://in-toto.io/Statement/v1', predicateType,
    subject: [{ name: `pkg:npm/%40master/css-next@${oldVersion}`, digest: { sha512: Buffer.from(oldIntegrity.slice(7), 'base64').toString('hex') } }],
    predicate: { buildDefinition: { buildType: 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
      externalParameters: { workflow: { ref, repository: source, path: oldWorkflow } },
      internalParameters: { github: { repository_id: String(repo.id), event_name: 'workflow_dispatch' } },
      resolvedDependencies: [{ uri: `git+${source}@${ref}`, digest: { gitCommit: oldRevision } }] },
    runDetails: { builder: { id: 'https://github.com/actions/runner/github-hosted' }, metadata: { invocationId: `${source}/actions/runs/41983776353/attempts/1` } } } }
  const bundle = statement => ({ dsseEnvelope: { payloadType: 'application/vnd.in-toto+json', payload: Buffer.from(JSON.stringify(statement)).toString('base64') } })
  assert.deepEqual(verifyHistoricalBootstrapStatement(bundle(original), oldIntegrity), original)
  for (const edit of [d => { d.subject[0].digest.sha512 = '0' }, d => { d.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = revision },
    d => { d.predicate.runDetails.metadata.invocationId += '0' }]) {
    const data = structuredClone(original); edit(data)
    assert.throws(() => verifyHistoricalBootstrapStatement(bundle(data), oldIntegrity))
  }
})

function cleanupFixture({ read = () => ({ tags: latestTags, alias: oldVersion }), publish = false } = {}) {
  const observations = []
  const version = { name: oldName, version: oldVersion, gitHead: oldRevision, dist: { integrity: oldIntegrity } }
  const options = { revision, cleanup: true, publish, confirm: cleanupConfirmation, env: publicationEnv(),
    loadHistorical: async () => ({}), verifyPackage: async () => ({ publicTarballByteIdentical: true, cryptographicProvenanceVerified: true }),
    fetchMetadata: async (url, config) => {
      const route = new URL(url)
      const auth = config.headers.Authorization === `Bearer ${token}`
      assert.equal(route.hostname, 'registry.npmjs.org')
      assert.equal(config.redirect, 'error')
      const abbreviated = config.headers.accept === 'application/vnd.npm.install-v1+json'
      observations.push({ path: route.pathname, search: route.search, auth, abbreviated })
      const { tags, alias } = read(route, auth)
      if (route.pathname === `/-/package/${registryName}/dist-tags`) return Response.json(tags)
      if (route.pathname === `/${registryName}/latest`) return alias === null ? absent() : Response.json({ ...version, version: alias })
      assert.equal(route.pathname, `/${registryName}`)
      if (auth) assert.equal(route.search, '?write=true')
      return Response.json({ name: oldName, 'dist-tags': tags, versions: { [oldVersion]: abbreviated ? { dist: version.dist } : version, '0.0.0-stage': {
        description: abbreviated ? undefined : 'Temporary package placeholder for staged publishing',
        dist: { integrity: 'sha512-/m0BuqDmx3lEMNP1oyClKRV7RlWpECNGAwr6yJN8t4LLNVSTzWy/WWfVNzx7RuebiyNzC/Vn3Zkk9kmjt8K+oA==' } } } })
    } }
  return { observations, options }
}

test('cleanup deletes only archived latest once and waits for ordinary packument and aliases to converge', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-c5-cleanup-')), output = join(root, 'receipt')
  let deleted = false, time = 0, calls = 0, cwd
  const { options, observations } = cleanupFixture({ read: (route, auth) => ({
    tags: deleted && (route.search || route.pathname.endsWith('/dist-tags') || time >= 300_000) ? onlyBootstrap : latestTags,
    alias: deleted && (auth || time >= 300_000) ? null : oldVersion }) })
  try {
    const receipt = await cleanupFailedBootstrapLatest(output, { ...options, wait: async delay => { time += delay }, run: async (command, args, session) => {
      calls++; cwd = session.cwd
      assert.equal(command, 'npm')
      assert.deepEqual(args, ['dist-tag', 'rm', oldName, 'latest', '--registry', 'https://registry.npmjs.org/', '--fetch-retries=0', '--color=false'])
      assert.equal(session.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, undefined)
      assert.equal(session.env.NPM_PACKAGE_BOOTSTRAP_TOKEN, token)
      assert.equal((await readJSON(join(output, 'cleanup-receipt.json'))).latestRemovalPerformed, null)
      deleted = true
      return { stdout: `-latest: ${oldName}@${oldVersion}\n` }
    } })
    assert.equal(calls, 1)
    assert.ok(time >= 300_000)
    assert.equal(receipt.state, 'verified')
    assert.equal(receipt.latestAliasHTTPStatusAfter, 404)
    assert.deepEqual(receipt.tagsAfter, onlyBootstrap)
    assert.equal(receipt.publicationPerformed, false)
    assert.ok(observations.some(o => o.auth && o.path.endsWith('/latest')) && observations.some(o => !o.auth && o.path.endsWith('/latest')))
    assert.ok(observations.some(o => o.abbreviated && !o.auth && !o.search))
    assert.ok(!(await readFile(join(output, 'cleanup-receipt.json'), 'utf8')).includes(token))
    await assert.rejects(stat(cwd), { code: 'ENOENT' })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('cleanup rejects unexpected tags, aliases, mixed mode and an observed concurrent change before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-c5-cleanup-conflict-'))
  try {
    let directReads = 0, calls = 0
    const cases = [cleanupFixture({ read: () => ({ tags: { ...latestTags, rc: '2.0.0-rc.1' }, alias: oldVersion }) }),
      cleanupFixture({ read: () => ({ tags: latestTags, alias: '2.0.0' }) }), cleanupFixture({ publish: true }),
      cleanupFixture({ read: route => ({ tags: route.pathname.endsWith('/dist-tags') && ++directReads > 2 ? { ...latestTags, latest: '2.0.0' } : latestTags, alias: oldVersion }) })]
    for (const [index, { options }] of cases.entries()) {
      await assert.rejects(cleanupFailedBootstrapLatest(join(root, String(index)), { ...options, run: () => { calls++; throw Error('should not write') } }))
    }
    assert.equal(calls, 0)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('cleanup refusal or stale registry leaves attempted receipt and never retries DELETE', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-c5-cleanup-failure-'))
  try {
    for (const failure of ['credential', 'stale']) {
      let calls = 0, waited = 0
      const output = join(root, failure), { options } = cleanupFixture()
      await assert.rejects(cleanupFailedBootstrapLatest(output, { ...options, wait: async delay => { waited += delay }, run: async () => {
        calls++
        if (failure === 'credential') throw Error(token)
        return { stdout: `-latest: ${oldName}@${oldVersion}\n` }
      } }), error => !error.message.includes(token) && /receipt/.test(error.message))
      assert.equal(calls, 1)
      assert.equal((await readJSON(join(output, 'cleanup-receipt.json'))).state, 'attempted')
      assert.ok(failure === 'credential' ? waited === 0 : waited > 300_000)
    }
  } finally { await rm(root, { recursive: true, force: true }) }
})
