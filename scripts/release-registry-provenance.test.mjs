import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'
import { verifyReleaseProvenance } from './release-registry-provenance.mjs'

const revision = 'a'.repeat(40), version = '2.0.0'
const ref = 'refs/heads/main', repository = 'https://github.com/master-co/css'
const workflow = '.github/workflows/release.yml', predicateType = 'https://slsa.dev/provenance/v1'
const endpoint = name => `https://registry.npmjs.org/-/npm/v1/attestations/${name.replace('/', '%2f')}@${version}`

function fixture() {
  const state = { revision, version, packages: ['css', 'css-runtime'].map((name, index) => ({
    name: `@master/${name}`, provenance: true,
    integrity: `sha512-${createHash('sha512').update(name).digest('base64')}`,
    uploadRun: ['100:1', '200:2'][index], uploadEvent: ['push', 'workflow_dispatch'][index]
  })) }
  const manifests = state.packages.map(pkg => ({ name: pkg.name, version, gitHead: revision,
    dist: { integrity: pkg.integrity, attestations: { url: endpoint(pkg.name) } } }))
  const statements = state.packages.map(pkg => ({
    _type: 'https://in-toto.io/Statement/v1', predicateType,
    subject: [{ name: `pkg:npm/${pkg.name.replace('@', '%40')}@${version}`, digest: { sha512: Buffer.from(pkg.integrity.slice(7), 'base64').toString('hex') } }],
    predicate: {
      buildDefinition: {
        buildType: 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1',
        externalParameters: { workflow: { repository, path: workflow, ref } },
        internalParameters: { github: { repository_id: '434642460', event_name: pkg.uploadEvent } },
        resolvedDependencies: [{ uri: `git+${repository}@${ref}`, digest: { gitCommit: revision } }]
      },
      runDetails: {
        builder: { id: 'https://github.com/actions/runner/github-hosted' },
        metadata: { invocationId: `${repository}/actions/runs/${pkg.uploadRun.split(':')[0]}/attempts/${pkg.uploadRun.split(':')[1]}` }
      }
    }
  }))
  const requests = [], verified = []
  const response = (index, duplicate = false) => {
    const provenance = { predicateType, bundle: { dsseEnvelope: { payloadType: 'application/vnd.in-toto+json',
      payload: Buffer.from(JSON.stringify(statements[index])).toString('base64') } } }
    return JSON.stringify({ attestations: [provenance, ...(duplicate ? [provenance] : [{ predicateType: 'other' }])] })
  }
  const options = {
    state, context: { env: { GITHUB_REF: ref, PATH: '/known/tool/bin', NODE_OPTIONS: 'never-forward', NODE_AUTH_TOKEN: 'never-forward' } }, manifests,
    fetchMetadata: async (url, options) => {
      const index = state.packages.findIndex(pkg => endpoint(pkg.name) === url)
      assert.ok(index >= 0)
      assert.equal(options.redirect, 'error')
      assert.ok(options.signal instanceof AbortSignal)
      assert.deepEqual(options.headers, { accept: 'application/json', 'cache-control': 'no-cache' })
      requests.push(url)
      return new Response(response(index))
    },
    verifySignature: async (bundle, expected) => {
      const payload = JSON.parse(Buffer.from(bundle.dsseEnvelope.payload, 'base64'))
      assert.equal(payload.predicate.runDetails.metadata.invocationId, expected.invocation)
      assert.equal(expected.workflowIdentity, `${repository}/${workflow}@${ref}`)
      verified.push({ name: expected.name, event: expected.event, invocation: expected.invocation })
    }
  }
  return { state, manifests, statements, requests, verified, options, response }
}

test('verifies each required subject against its own recorded upload run and returns only bounded evidence', async () => {
  const f = fixture()
  f.manifests.reverse()
  const proof = await verifyReleaseProvenance(f.options)
  assert.equal(proof.verifiedCount, 2)
  assert.equal(proof.cryptographicProvenanceVerified, true)
  assert.equal(proof.revision, revision)
  assert.equal(proof.version, version)
  assert.deepEqual(f.verified.map(({ event, invocation }) => [event, invocation]), [
    ['push', `${repository}/actions/runs/100/attempts/1`],
    ['workflow_dispatch', `${repository}/actions/runs/200/attempts/2`]
  ])
  assert.deepEqual(proof.packages, f.state.packages.map(({ name, integrity, uploadRun, uploadEvent }, index) => ({
    name, version, integrity, uploadRun, uploadEvent, attestationSHA256: createHash('sha256').update(f.response(index)).digest('hex')
  })))
})

test('rejects an incomplete manifest cohort, wrong source/SRI, unknown upload and unsafe endpoint before fetching', async () => {
  for (const [mutate, expected] of [
    [f => f.manifests.pop(), /complete exact registry manifest cohort/],
    [f => { f.manifests[1] = f.manifests[0] }, /Duplicate package/],
    [f => { f.manifests[0].gitHead = 'b'.repeat(40) }, /Registry manifest identity/],
    [f => { f.manifests[1].dist.integrity = f.manifests[0].dist.integrity }, /Registry manifest identity/],
    [f => { f.state.packages[1].uploadRun = undefined }, /Missing exact npm upload run/],
    [f => { f.state.packages[0].uploadEvent = 'pull_request_target' }, /Invalid npm upload event/],
    [f => { f.options.context.env.GITHUB_REF = 'refs/pull/12/merge' }, /exact formal release branch/],
    [f => { f.manifests[1].dist.attestations.url = 'https://wrong.invalid/?secret=sentinel' }, /Unexpected npm attestation URL/]
  ]) {
    const f = fixture()
    mutate(f)
    await assert.rejects(verifyReleaseProvenance(f.options), error => expected.test(error.message) && !error.message.includes('sentinel'))
    assert.deepEqual(f.requests, [])
    assert.deepEqual(f.verified, [])
  }
})

test('rejects wrong subject, source or uploader claims even with a working signature verifier', async () => {
  for (const [mutate, expected] of [
    [s => { s.subject[0].name = 'pkg:npm/wrong@2.0.0' }, /subject or archive digest/],
    [s => { s.subject[0].digest.sha512 = '0'.repeat(128) }, /subject or archive digest/],
    [s => { s.subject.push(s.subject[0]) }, /subject or archive digest/],
    [s => { s.predicate.buildDefinition.externalParameters.workflow.path = '.github/workflows/other.yml' }, /repository, workflow, ref or revision/],
    [s => { s.predicate.buildDefinition.externalParameters.workflow.ref = 'refs/heads/rc' }, /repository, workflow, ref or revision/],
    [s => { s.predicate.buildDefinition.internalParameters.github.repository_id = '1234' }, /repository, workflow, ref or revision/],
    [s => { s.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40) }, /repository, workflow, ref or revision/],
    [s => { s.predicate.buildDefinition.internalParameters.github.event_name = 'workflow_dispatch' }, /upload run, event or hosted builder/],
    [s => { s.predicate.runDetails.metadata.invocationId = `${repository}/actions/runs/100/attempts/2` }, /upload run, event or hosted builder/],
    [s => { s.predicate.runDetails.builder.id = 'https://github.com/actions/runner/self-hosted' }, /upload run, event or hosted builder/]
  ]) {
    const f = fixture()
    mutate(f.statements[0])
    await assert.rejects(verifyReleaseProvenance(f.options), expected)
    assert.equal(f.requests.length, 1)
    assert.deepEqual(f.verified, [])
  }
})

test('rejects ambiguous, malformed, oversized and unauthorized registry evidence without treating it as verified', async () => {
  for (const [response, expected] of [
    [f => new Response(f.response(0, true)), /exactly one npm SLSA provenance attestation/],
    [() => new Response('{ malformed sentinel'), /Invalid npm attestation JSON/],
    [() => new Response(Buffer.alloc(4 * 1024 ** 2 + 1)), /Invalid or oversized/],
    [() => new Response('{}', { status: 401 }), /HTTP 401/]
  ]) {
    const f = fixture()
    let reads = 0
    f.options.fetchMetadata = async () => { reads++; return response(f) }
    await assert.rejects(verifyReleaseProvenance(f.options), error => expected.test(error.message) && !error.message.includes('sentinel'))
    assert.equal(reads, 1)
    assert.deepEqual(f.verified, [])
  }
})

test('retries read-only eventual absence, then refuses a failed signature with no proof', async () => {
  const f = fixture()
  const fetchMetadata = f.options.fetchMetadata
  let attempts = 0
  f.options.fetchMetadata = (url, options) => ++attempts === 1 ? new Response(null, { status: 404 }) : fetchMetadata(url, options)
  f.options.verifySignature = async (_bundle, expected) => {
    if (expected.name === '@master/css-runtime') throw new Error('fixture invalid signature')
  }
  await assert.rejects(verifyReleaseProvenance(f.options), /fixture invalid signature/)
  assert.equal(attempts, 3)
  assert.deepEqual(f.requests, f.state.packages.map(pkg => endpoint(pkg.name)))
})

test('isolates the pinned npm trust lookup and hides tool errors without querying npm attestations', async () => {
  const f = fixture()
  let directory
  f.options.verifySignature = undefined
  f.options.run = async (file, args, options) => {
    directory = options.cwd
    assert.equal(file, 'npm')
    assert.deepEqual(args, ['root', '--global'])
    assert.equal(options.extendEnv, false)
    assert.deepEqual(Object.keys(options.env).sort(), ['NPM_CONFIG_CACHE', 'NPM_CONFIG_GLOBALCONFIG', 'NPM_CONFIG_USERCONFIG', 'PATH'])
    assert.notEqual(options.env.NPM_CONFIG_USERCONFIG, options.env.NPM_CONFIG_GLOBALCONFIG)
    for (const config of [options.env.NPM_CONFIG_USERCONFIG, options.env.NPM_CONFIG_GLOBALCONFIG]) assert.equal(await readFile(config, 'utf8'), '')
    throw new Error('sentinel output from failed npm subprocess')
  }
  await assert.rejects(verifyReleaseProvenance(f.options), error => /isolated npm 11.21.0 Sigstore verifier/.test(error.message) && !error.message.includes('sentinel'))
  assert.ok(directory)
  await assert.rejects(stat(directory), { code: 'ENOENT' })
  assert.deepEqual(f.requests, [])
})
