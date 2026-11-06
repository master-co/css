import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import test from 'node:test'
import { createWorkspaceRelease, packedManifest } from './semantic-release-workspace.mjs'
import { createReleasePromotion, readInstallableVersion, readPublishedPackage, readRegistryTags, readRegistryVersion } from './semantic-release-promotion.mjs'
import { recoverRelease } from './release-recover.mjs'
import { registryConsumerEnvironment, verifyRegistryLock } from './release-registry-consumer.mjs'

function archive(manifest) {
  const bytes = Buffer.from(JSON.stringify(manifest)), header = Buffer.alloc(512)
  header.write('package/package.json')
  header.write(bytes.length.toString(8).padStart(11, '0'), 124)
  return gzipSync(Buffer.concat([header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512), Buffer.alloc(1024)]))
}

async function fixture(t) {
  const cwd = await mkdtemp(join(tmpdir(), 'master-promotion-'))
  t.after(() => rm(cwd, { recursive: true, force: true }))
  const config = { workspaceRoots: ['packages/a', 'packages/b'] }
  const revision = 'a'.repeat(40)
  const context = { cwd, env: { GITHUB_ACTIONS: 'true', GITHUB_SHA: revision, GITHUB_RUN_ID: '1',
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://fixture.invalid', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture', GITHUB_EVENT_NAME: 'push',
    MASTER_CSS_RELEASE_STAGE: '1', MASTER_CSS_RELEASE_PROMOTE: '1' }, nextRelease: { version: '2.0.0', channel: 'rc', gitHead: revision } }
  const registry = new Map(), calls = [], waits = []
  const controls = { failUpload: null, failAfterUpload: null, failTag: null, failAfterTag: null, failConsumer: false, failProvenance: false, wrongProof: false,
    afterTagReads: [], autoLatest: false, forbiddenTags: null }
  const pendingTagReads = new Map()
  for (const letter of ['a', 'b']) {
    const root = join(cwd, 'packages', letter)
    await mkdir(root, { recursive: true })
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: `@fixture/${letter}`, version: '0.0.0', publishConfig: { provenance: true },
      repository: { type: 'git', url: 'https://github.com/master-co/css.git', directory: `packages/${letter}` } }))
    registry.set(`@fixture/${letter}`, { versions: {}, 'dist-tags': { rc: '1.0.0', latest: '0.9.0' } })
  }
  const fetchMetadata = async url => {
    const path = new URL(url).pathname
    const tags = /^\/-\/package\/([^/]+)\/dist-tags$/.exec(path)
    if (tags) {
      const name = decodeURIComponent(tags[1]), data = registry.get(name)
      assert.ok(data)
      if (controls.forbiddenTags === name) return new Response('{}', { status: 401 })
      const delayed = pendingTagReads.get(name)
      return Response.json(delayed?.length ? { ...data['dist-tags'], rc: delayed.shift() } : data['dist-tags'])
    }
    const packument = /^\/([^/]+)$/.exec(path)
    if (packument) {
      const name = decodeURIComponent(packument[1]), data = registry.get(name)
      assert.ok(data)
      return Response.json({ ...data, name })
    }
    const exact = /^\/([^/]+)\/([^/]+)$/.exec(path)
    const data = exact && registry.get(decodeURIComponent(exact[1]))?.versions[decodeURIComponent(exact[2])]
    return data ? Response.json(data) : new Response('{}', { status: 404 })
  }
  const run = async (command, args, options) => {
    if (command === 'bun') {
      await writeFile(args[args.indexOf('--filename') + 1], archive(JSON.parse(await readFile(join(options.cwd, 'package.json')))))
    } else {
      calls.push(args)
      assert.equal(command, 'npm')
      assert.equal(options.extendEnv, false)
      if (args[0] === 'publish') {
        const bytes = await readFile(args[1]), pkg = packedManifest(bytes)
        if (controls.failUpload === pkg.name) throw new Error('fixture upload interruption')
        const data = registry.get(pkg.name)
        assert.equal(data.versions[pkg.version], undefined, 'Never republish an immutable version')
        data.versions[pkg.version] = { name: pkg.name, version: pkg.version, gitHead: pkg.gitHead, dist: {
          integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
          attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/fixture' }
        } }
        data['dist-tags'][args[args.indexOf('--tag') + 1]] = pkg.version
        if (controls.autoLatest) data['dist-tags'].latest = pkg.version
        if (controls.failAfterUpload === pkg.name) throw new Error('fixture lost upload response')
      } else {
        assert.deepEqual(args.slice(0, 2), ['dist-tag', 'add'])
        const split = args[2].lastIndexOf('@'), name = args[2].slice(0, split), version = args[2].slice(split + 1)
        if (controls.failTag === name) throw new Error('fixture tag interruption')
        registry.get(name)['dist-tags'][args[3]] = version
        if (name === '@fixture/a' && controls.afterTagReads.length) pendingTagReads.set(name, [...controls.afterTagReads])
        if (controls.failAfterTag === name) throw new Error('fixture lost tag response')
      }
    }
    return { stdout: '' }
  }
  const workspace = createWorkspaceRelease({ run, fetchMetadata })
  const provenanceProbe = async ({ state, manifests }) => {
    if (controls.failProvenance) throw new Error('fixture invalid npm provenance signature')
    assert.deepEqual(manifests.map(manifest => manifest.name), state.packages.map(pkg => pkg.name))
    const packages = state.packages.map(({ name, integrity, uploadRun, uploadEvent }) =>
      ({ name, integrity, uploadRun, uploadEvent, version: state.version, attestationSHA256: 'f'.repeat(64) }))
    if (controls.wrongProof) packages[0].uploadRun = '99:1'
    return { schemaVersion: 1, revision: state.revision, version: state.version, verifiedCount: manifests.length,
      cryptographicProvenanceVerified: true, packages }
  }
  const promotion = createReleasePromotion({ run, fetchMetadata, provenanceProbe, wait: async delay => { waits.push(delay) }, consumerProbe: async state => {
    if (controls.failConsumer) throw new Error('fixture registry consumer failed')
    return { version: state.version, revision: state.revision }
  } })
  t.after(() => workspace.fail())
  const prepare = async () => { for (const pkgRoot of config.workspaceRoots) await workspace.prepare({ ...config, pkgRoot }, context) }
  const stage = async (letter = 'a') => workspace.publish({ ...config, pkgRoot: `packages/${letter}` }, context)
  const state = async () => JSON.parse(await readFile(join(cwd, 'release-artifacts/promotion-state.json')))
  return { cwd, config, context, registry, calls, waits, controls, workspace, promotion, prepare, stage, state, run, fetchMetadata, provenanceProbe }
}

test('all archives stage without formal tags; full verified cohort promotes before addChannel', async t => {
  const f = await fixture(t)
  await f.prepare()
  await f.stage('a')
  await assert.rejects(f.promotion.publish(f.config, f.context), /Candidate version missing/)
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
  await f.stage('b')
  for (const data of f.registry.values()) assert.equal(data['dist-tags'].rc, '1.0.0')
  await f.promotion.publish(f.config, f.context)
  assert.equal((await f.state()).channels.rc.complete, true)
  f.context.nextRelease.channel = undefined
  await f.promotion.addChannel(f.config, f.context)
  for (const data of f.registry.values()) assert.equal(data['dist-tags'].latest, '2.0.0')
  assert.deepEqual(f.calls.filter(args => args[0] === 'publish').map(args => args[args.indexOf('--tag') + 1]), ['candidate-2.0.0', 'candidate-2.0.0'])
})

test('partial upload recovery requires archived state and exact existing integrity', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a')
  f.controls.failAfterUpload = '@fixture/b'
  await assert.rejects(f.stage('b'), /lost upload response/)
  f.context.env.GITHUB_RUN_ID = '2'
  await assert.rejects(f.stage('a'), /explicit recovery/)
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  // Re-running prepare reuses archived bytes; it must not replace immutable evidence.
  const archived = await readFile(join(f.cwd, 'release-artifacts/packages/fixture-a-2.0.0.tgz'))
  await f.prepare()
  assert.deepEqual(await readFile(join(f.cwd, 'release-artifacts/packages/fixture-a-2.0.0.tgz')), archived)
  await f.stage('a')
  await f.stage('b')
  await f.promotion.publish(f.config, f.context)
  assert.equal(f.calls.filter(args => args[0] === 'publish').length, 2)
})

test('recovery does not resubmit an ambiguous write while the exact version is absent', async t => {
  const f = await fixture(t)
  await f.prepare()
  f.controls.failUpload = '@fixture/a'
  await assert.rejects(f.stage('a'), /upload interruption/)
  f.controls.failUpload = null
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  f.context.env.GITHUB_RUN_ID = '2'
  await assert.rejects(f.stage('a'), /Previous npm upload .* is unresolved/)
  assert.equal(f.calls.filter(args => args[0] === 'publish').length, 1)
  assert.equal((await f.state()).packages[0].uploadRun, '1:1')
})

test('wrong packed source anywhere in the cohort blocks the first publish', async t => {
  const f = await fixture(t)
  await f.prepare()
  const file = join(f.cwd, 'release-artifacts/packages/fixture-b-2.0.0.tgz')
  const original = packedManifest(await readFile(file))
  await writeFile(file, archive({ ...original, gitHead: 'b'.repeat(40) }))
  await assert.rejects(f.stage('a'), /Incorrect packed Git HEAD for @fixture\/b/)
  assert.deepEqual(f.calls, [])
})

test('a candidate upload that also changes latest stops before any further upload', async t => {
  const f = await fixture(t)
  await f.prepare()
  f.controls.autoLatest = true
  await assert.rejects(f.stage('a'), /Non-candidate registry tags changed while staging @fixture\/a/)
  assert.deepEqual(f.calls.map(args => args[0]), ['publish'])
  assert.equal(f.registry.get('@fixture/b').versions['2.0.0'], undefined)
  const item = (await f.state()).packages.find(pkg => pkg.name === '@fixture/a')
  assert.ok(item.attempt)
  assert.equal(item.staged, false)
  assert.deepEqual(item.tagsBefore, { rc: '1.0.0', latest: '0.9.0' })
  f.context.env.GITHUB_RUN_ID = '2'
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  await assert.rejects(f.stage('a'), /Non-candidate registry tags changed while staging @fixture\/a/)
  assert.deepEqual(f.calls.map(args => args[0]), ['publish'])
})

test('a visible candidate tag prevents uploading an exact version that is still unavailable', async t => {
  const f = await fixture(t)
  await f.prepare()
  f.registry.get('@fixture/a')['dist-tags']['candidate-2.0.0'] = '2.0.0'
  await assert.rejects(f.stage('a'), /Candidate tag already exists.*exact version is unavailable/)
  assert.deepEqual(f.calls, [])
})

test('partial promotion records interruption and recovers a successful command with a lost response', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.failAfterTag = '@fixture/b'
  await assert.rejects(f.promotion.publish(f.config, f.context), /lost tag response/)
  const interrupted = await f.state()
  assert.deepEqual(interrupted.channels.rc.promoted, ['@fixture/a'])
  assert.equal(interrupted.channels.rc.pending, '@fixture/b')
  f.context.env.GITHUB_RUN_ID = '2'
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  f.controls.failAfterTag = null
  await f.promotion.publish(f.config, f.context)
  assert.equal((await f.state()).channels.rc.complete, true)
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 2, 'No duplicate writes when registry confirms recorded pending operation')
})

test('wrong immutable bytes or missing provenance blocks every formal tag write', async t => {
  for (const field of ['integrity', 'attestations']) {
    const f = await fixture(t)
    await f.prepare(); await f.stage('a'); await f.stage('b')
    delete f.registry.get('@fixture/b').versions['2.0.0'].dist[field]
    await assert.rejects(f.promotion.publish(f.config, f.context), /integrity differs|provenance is missing/)
    assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
  }
})

test('observed concurrent formal-tag change aborts without automatic rollback', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.registry.get('@fixture/a')['dist-tags'].rc = '2.1.0'
  await assert.rejects(f.promotion.publish(f.config, f.context), /tag changed outside/)
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
  assert.equal(f.registry.get('@fixture/a')['dist-tags'].rc, '2.1.0')
})

test('a successful tag write can wait for the saved baseline to advance without reissuing the write', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.afterTagReads = ['1.0.0', '1.0.0']
  await f.promotion.publish(f.config, f.context)
  assert.equal((await f.state()).channels.rc.complete, true)
  assert.deepEqual(f.waits, [1000, 2000])
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 2)
})

test('an unrelated observed tag after a successful write stops before touching another package', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.afterTagReads = ['2.1.0']
  await assert.rejects(f.promotion.publish(f.config, f.context), /Formal tag verification failed: @fixture\/a@rc/)
  assert.equal((await f.state()).channels.rc.pending, '@fixture/a')
  assert.deepEqual(f.waits, [])
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 1)
})

test('addChannel without state, mismatched revision/cohort and modified archive fail closed', async t => {
  const f = await fixture(t)
  await assert.rejects(f.promotion.addChannel(f.config, f.context), /requires the archived/)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.context.nextRelease.gitHead = 'b'.repeat(40)
  await assert.rejects(f.promotion.publish(f.config, f.context), /revision differs/)
  f.context.nextRelease.gitHead = 'a'.repeat(40)
  await assert.rejects(f.promotion.publish({ workspaceRoots: ['packages/a'] }, f.context), /cohort differs/)
  await writeFile(join(f.cwd, 'release-artifacts/packages/fixture-a-2.0.0.tgz'), 'changed')
  await assert.rejects(f.promotion.publish(f.config, f.context), /archive changed/)
})

test('explicit flags and missing recovery baseline stop before any registry write', async t => {
  const f = await fixture(t)
  delete f.context.env.MASTER_CSS_RELEASE_PROMOTE
  await assert.rejects(f.promotion.verifyConditions(f.config, f.context), /MASTER_CSS_RELEASE_PROMOTE/)
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  await assert.rejects(f.prepare(), /requires the archived release state/i)
  assert.equal(f.calls.length, 0)
})


test('failed fresh registry consumer aborts before any formal tag mutation', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.failConsumer = true
  await assert.rejects(f.promotion.publish(f.config, f.context), /registry consumer failed/)
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
})

test('an invalid registry provenance signature prevents all formal tag writes', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.failProvenance = true
  await assert.rejects(f.promotion.publish(f.config, f.context), /invalid npm provenance signature/)
  const state = await f.state()
  assert.equal(state.provenanceProof, undefined)
  assert.equal(state.consumerProof, undefined)
  assert.deepEqual(state.packages.map(({ uploadRun, uploadEvent }) => [uploadRun, uploadEvent]), [['1:1', 'push'], ['1:1', 'push']])
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
})

test('a same-count provenance receipt cannot substitute another upload identity before promotion', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a'); await f.stage('b')
  f.controls.wrongProof = true
  await assert.rejects(f.promotion.publish(f.config, f.context), /exact package archives and upload identities/)
  assert.equal(f.calls.filter(args => args[0] === 'dist-tag').length, 0)
})

test('registry eventual absence/transient errors retry within bounds; immutable mismatch fails immediately', async () => {
  const pkg = { name: '@fixture/a', integrity: 'sha512-YQ==', provenance: true, gitHead: 'a'.repeat(40) }
  const version = '2.0.0'
  const published = { name: pkg.name, version, gitHead: pkg.gitHead,
    dist: { integrity: pkg.integrity, attestations: { url: 'https://registry.npmjs.org/proof' } } }
  const responses = [new Response('', { status: 503 }), new Response('{}', { status: 404 }),
    Response.json({ ...published, dist: { integrity: pkg.integrity } }), Response.json(published)]
  let calls = 0
  assert.deepEqual(await readPublishedPackage(pkg, version, async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/@fixture%2fa/2.0.0')
    assert.ok(options.signal instanceof AbortSignal)
    assert.equal(options.headers['cache-control'], 'no-cache')
    assert.equal(options.redirect, 'error')
    calls++
    return responses.shift()
  }, async () => {}), published)
  assert.equal(calls, 4)
  for (const [wrong, message] of [
    [{ ...published, dist: { integrity: 'sha512-Yg==' } }, /integrity differs/],
    [{ ...published, gitHead: 'b'.repeat(40) }, /source differs/],
    [{ ...published, name: '@fixture/b' }, /package name differs/],
    [{ ...published, version: '2.0.1' }, /version differs/]
  ]) {
    calls = 0
    await assert.rejects(readPublishedPackage(pkg, version, async () => { calls++; return Response.json(wrong) }, async () => {}), message)
    assert.equal(calls, 1)
  }
  calls = 0
  const delays = []
  await assert.rejects(readPublishedPackage(pkg, version, async () => { calls++; return new Response('{}', { status: 404 }) },
    async delay => { delays.push(delay) }), /Candidate version missing/)
  assert.equal(calls, delays.length + 1)
  assert.ok(delays.reduce((sum, delay) => sum + delay, 0) > 15 * 60_000)
  assert.ok(delays.reduce((sum, delay) => sum + delay, 0) < 20 * 60_000)
})

test('the npm install packument must expose the same immutable archive before dependent uploads', async () => {
  const pkg = { name: '@fixture/a', integrity: 'sha512-YQ==', gitHead: 'a'.repeat(40), provenance: true }
  const version = '2.0.0'
  const published = { name: pkg.name, version, dist: { integrity: pkg.integrity } }
  let reads = 0, pauses = 0
  assert.deepEqual(await readInstallableVersion(pkg, version, async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/@fixture%2fa')
    assert.equal(options.headers.accept, 'application/vnd.npm.install-v1+json')
    return Response.json({ name: pkg.name, versions: ++reads === 1 ? {} : { [version]: published } })
  }, async () => { pauses++ }), published)
  assert.equal(reads, 2)
  assert.equal(pauses, 1)
  await assert.rejects(readInstallableVersion(pkg, version, async () => Response.json({
    name: pkg.name, versions: { [version]: { ...published, dist: { integrity: 'sha512-Yg==' } } }
  }), async () => assert.fail('Never retry wrong immutable bytes')), /integrity differs/)
})

test('only exact-version HTTP 404 is treated as absence, and tags come from the dedicated public endpoint', async () => {
  assert.equal(await readRegistryVersion('@fixture/a', '2.0.0', async () => new Response('{}', { status: 404 })), null)
  await assert.rejects(readRegistryVersion('@fixture/a', '2.0.0', async () => Response.json(null)), /Invalid registry document/)
  const tags = { latest: '1.0.0', bootstrap: '0.0.0-bootstrap.1' }
  assert.deepEqual(await readRegistryTags('@fixture/a', async url => {
    assert.equal(url, 'https://registry.npmjs.org/-/package/@fixture%2fa/dist-tags')
    return Response.json({ ...tags, _etag: 'fixture-etag' })
  }), tags)
  await assert.rejects(readRegistryTags('@fixture/a', async () => new Response('{}', { status: 404 })), /dist-tags unavailable/)
  await assert.rejects(readRegistryTags('@fixture/a', async () => new Response('{}', { status: 401 })), /401/)
  await assert.rejects(readRegistryTags('@fixture/a', async () => Response.json({ error: 'Not found' })), /dist-tags unavailable/)
})


test('automatic semantic-release addChannel is rejected before Git-note mutation', async t => {
  const f = await fixture(t)
  const branch = { name: 'main', type: 'release', tags: [
    { version: '2.0.0', gitTag: 'v2.0.0', channels: ['next'] },
    { version: '1.0.0', gitTag: 'v1.0.0', channels: [null] }
  ] }
  await assert.rejects(f.promotion.verifyConditions(f.config, { ...f.context, branch,
    branches: [branch, { name: 'next', channel: 'next', type: 'release' }], options: { tagFormat: 'v${version}' }
  }), /disabled before semantic-release writes Git notes/)
  assert.equal(f.calls.length, 0)
})

test('explicit recovery resumes immutable archives independently of semantic-release Git tags', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a')
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  f.context.env.GITHUB_RUN_ID = '2'
  f.context.env.GITHUB_EVENT_NAME = 'workflow_dispatch'
  await rename(join(f.cwd, 'packages/a'), join(f.cwd, 'packages/source-a'))
  await rename(join(f.cwd, 'packages/b'), join(f.cwd, 'packages/source-b'))
  await rename(join(f.cwd, 'release-artifacts'), join(f.cwd, 'restored-evidence'))
  const restoredState = join(f.cwd, 'restored-evidence/promotion-state.json')
  const result = await recoverRelease({ root: f.cwd, stateFile: restoredState,
    channel: 'rc', environment: f.context.env, run: f.run, fetchMetadata: f.fetchMetadata,
    provenanceProbe: f.provenanceProbe, consumerProbe: async state => ({ version: state.version, revision: state.revision }) })
  assert.equal(result.channel, 'rc')
  assert.equal(f.calls.filter(args => args[0] === 'publish').length, 2)
  const restored = JSON.parse(await readFile(restoredState))
  assert.equal(restored.channels.rc.complete, true)
  assert.deepEqual(restored.provenanceProof.packages.map(({ uploadRun, uploadEvent }) => [uploadRun, uploadEvent]),
    [['1:1', 'push'], ['2:1', 'workflow_dispatch']])
})

test('public registry consumer strips release credentials and rejects nonregistry or mismatched locks', () => {
  const env = registryConsumerEnvironment({ PATH: '/bin', HOME: '/home/fixture', GITHUB_TOKEN: 'secret', GH_TOKEN: 'secret',
    CLOUDFLARE_API_TOKEN: 'secret', NPM_TOKEN: 'secret', NODE_AUTH_TOKEN: 'secret', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'secret',
    NODE_OPTIONS: '--require poison.js', NODE_PATH: '/checkout', MASTER_CSS_NATIVE_BINDING_PATH: '/checkout/binding.node' }, '/cache')
  assert.deepEqual(Object.keys(env).sort(), ['HOME', 'NPM_CONFIG_CACHE', 'NPM_CONFIG_GLOBALCONFIG', 'NPM_CONFIG_USERCONFIG', 'PATH'])
  const names = ['@master/css', '@master/css-compiler', '@master/css-cli', '@master/css-binding']
  const state = { version: '2.0.0', packages: names.map(name => ({ name, integrity: 'sha512-YQ==' })) }
  const lock = { packages: Object.fromEntries(names.map(name => [`node_modules/${name}`, { version: '2.0.0', integrity: 'sha512-YQ==', resolved: `https://registry.npmjs.org/${name}/fixture.tgz` }])) }
  assert.equal(verifyRegistryLock(lock, state).length, 4)
  lock.packages['node_modules/@master/css'].resolved = 'file:/checkout/css.tgz'
  assert.throws(() => verifyRegistryLock(lock, state), /public npm/)
  lock.packages['node_modules/@master/css'].resolved = 'https://registry.npmjs.org/css.tgz'
  lock.packages['node_modules/@master/css'].version = '1.0.0'
  assert.throws(() => verifyRegistryLock(lock, state), /version differs/)
})

test('known registry version collisions fail verifyRelease before semantic-release creates its Git tag', async t => {
  const f = await fixture(t)
  await f.promotion.verifyRelease(f.config, f.context)
  f.registry.get('@fixture/a').versions['2.0.0'] = { name: '@fixture/a', version: '2.0.0' }
  await assert.rejects(f.promotion.verifyRelease(f.config, f.context), /before Git tagging/)
  assert.equal(f.calls.length, 0)
})

test('Git tagging requires a readable package tag map and stops if any tag already points to the proposed version', async t => {
  const f = await fixture(t)
  f.controls.forbiddenTags = '@fixture/a'
  await assert.rejects(f.promotion.verifyRelease(f.config, f.context), /dist-tags: 401/)
  f.controls.forbiddenTags = null
  f.registry.get('@fixture/a')['dist-tags'].latest = '2.0.0'
  await assert.rejects(f.promotion.verifyRelease(f.config, f.context), /tag already points to @fixture\/a@2\.0\.0 before Git tagging/)
  assert.deepEqual(f.calls, [])
})

test('configured release uploads the public dependency graph before cohort promotion and GitHub', async () => {
  const { default: config } = await import('../release.config.js')
  const { publishedDependencies } = await import('./release-readiness.mjs')
  const workspace = './scripts/semantic-release-workspace.mjs'
  const promotion = './scripts/semantic-release-promotion.mjs'
  const positions = config.plugins.map((plugin, index) => [Array.isArray(plugin) ? plugin[0] : plugin, index])
  const promoteAt = positions.find(([name]) => name === promotion)[1]
  assert.ok(positions.filter(([name]) => name === workspace).every(([, index]) => index < promoteAt))
  assert.deepEqual(positions.slice(0, 4).map(([name]) => name), [
    '@semantic-release/commit-analyzer', '@semantic-release/release-notes-generator',
    './scripts/semantic-release-major-guard.mjs', './scripts/semantic-release-notes.mjs'
  ])
  assert.equal(config.plugins.at(-2)[0], promotion)
  assert.equal(config.plugins.at(-1)[0], '@semantic-release/github')

  const packageRoots = config.plugins.filter(plugin => Array.isArray(plugin) && plugin[0] === workspace).map(plugin => plugin[1].pkgRoot)
  const packages = await Promise.all(packageRoots.map(async root => JSON.parse(await readFile(new URL(`../${root}/package.json`, import.meta.url)))))
  const order = new Map(packages.map(({ name }, index) => [name, index]))
  assert.equal(order.size, 34)
  for (const pkg of packages) {
    assert.notEqual(pkg.private, true)
    for (const dependency of publishedDependencies(pkg, order)) {
      assert.ok(order.get(dependency) < order.get(pkg.name), `Upload ${dependency} before ${pkg.name}`)
    }
  }
  assert.deepEqual(packageRoots.slice(8, 12), ['packages/schema', 'packages/binding-wasm-compiler',
    'packages/binding-wasm-engine', 'packages/binding-wasm-tooling'])

  const installFields = {
    dependencies: { '@fixture/runtime': 'workspace:*', '@fixture/private': 'workspace:*', external: '^1.0.0' },
    optionalDependencies: { '@fixture/native': 'workspace:*' },
    peerDependencies: { '@fixture/peer': 'workspace:*' },
    devDependencies: { '@fixture/build-only': 'workspace:*' }
  }
  assert.deepEqual(publishedDependencies(installFields, new Set(['@fixture/runtime', '@fixture/native', '@fixture/peer', '@fixture/build-only'])),
    ['@fixture/runtime', '@fixture/native', '@fixture/peer'])
})

test('corrupted recovery state cannot publish missing packages directly to a formal tag', async t => {
  const f = await fixture(t)
  await f.prepare(); await f.stage('a')
  const state = await f.state()
  state.candidateTag = 'latest'
  await writeFile(join(f.cwd, 'release-artifacts/promotion-state.json'), JSON.stringify(state))
  await assert.rejects(f.stage('b'), /candidate-only tag/)
  assert.equal(f.calls.filter(args => args[0] === 'publish').length, 1)
})
