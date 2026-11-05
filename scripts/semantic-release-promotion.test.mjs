import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import test from 'node:test'
import { createWorkspaceRelease, packedManifest } from './semantic-release-workspace.mjs'
import { createReleasePromotion, readPublishedPackage } from './semantic-release-promotion.mjs'
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
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://fixture.invalid', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture',
    MASTER_CSS_RELEASE_STAGE: '1', MASTER_CSS_RELEASE_PROMOTE: '1' }, nextRelease: { version: '2.0.0', channel: 'rc', gitHead: revision } }
  const registry = new Map(), calls = []
  const controls = { failUpload: null, failTag: null, failAfterTag: null, failConsumer: false }
  for (const letter of ['a', 'b']) {
    const root = join(cwd, 'packages', letter)
    await mkdir(root, { recursive: true })
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: `@fixture/${letter}`, version: '0.0.0', publishConfig: { provenance: true } }))
    registry.set(`@fixture/${letter}`, { versions: {}, 'dist-tags': { rc: '1.0.0', latest: '0.9.0' } })
  }
  const fetchMetadata = async url => Response.json(registry.get(decodeURIComponent(url.split('/').at(-1))))
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
        data.versions[pkg.version] = { version: pkg.version, dist: {
          integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
          attestations: { url: 'https://registry.npmjs.org/-/npm/v1/attestations/fixture' }
        } }
        data['dist-tags'][args[args.indexOf('--tag') + 1]] = pkg.version
      } else {
        assert.deepEqual(args.slice(0, 2), ['dist-tag', 'add'])
        const split = args[2].lastIndexOf('@'), name = args[2].slice(0, split), version = args[2].slice(split + 1)
        if (controls.failTag === name) throw new Error('fixture tag interruption')
        registry.get(name)['dist-tags'][args[3]] = version
        if (controls.failAfterTag === name) throw new Error('fixture lost tag response')
      }
    }
    return { stdout: '' }
  }
  const workspace = createWorkspaceRelease({ run, fetchMetadata })
  const promotion = createReleasePromotion({ run, fetchMetadata, consumerProbe: async state => {
    if (controls.failConsumer) throw new Error('fixture registry consumer failed')
    return { version: state.version, revision: state.revision }
  } })
  t.after(() => workspace.fail())
  const prepare = async () => { for (const pkgRoot of config.workspaceRoots) await workspace.prepare({ ...config, pkgRoot }, context) }
  const stage = async (letter = 'a') => workspace.publish({ ...config, pkgRoot: `packages/${letter}` }, context)
  const state = async () => JSON.parse(await readFile(join(cwd, 'release-artifacts/promotion-state.json')))
  return { cwd, config, context, registry, calls, controls, workspace, promotion, prepare, stage, state, run, fetchMetadata }
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
  f.controls.failUpload = '@fixture/b'
  await assert.rejects(f.stage('b'), /upload interruption/)
  f.context.env.GITHUB_RUN_ID = '2'
  await assert.rejects(f.stage('a'), /explicit recovery/)
  f.context.env.MASTER_CSS_RELEASE_RECOVERY = '1'
  // Re-running prepare reuses archived bytes; it must not replace immutable evidence.
  const archived = await readFile(join(f.cwd, 'release-artifacts/packages/fixture-a-2.0.0.tgz'))
  await f.prepare()
  assert.deepEqual(await readFile(join(f.cwd, 'release-artifacts/packages/fixture-a-2.0.0.tgz')), archived)
  await f.stage('a')
  f.controls.failUpload = null
  await f.stage('b')
  await f.promotion.publish(f.config, f.context)
  assert.equal(f.calls.filter(args => args[0] === 'publish' && args[1].includes('fixture-a-')).length, 1)
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

test('registry eventual absence/transient errors retry within bounds; immutable mismatch fails immediately', async () => {
  const pkg = { name: '@fixture/a', integrity: 'sha512-YQ==', provenance: true }
  const published = { versions: { '2.0.0': { version: '2.0.0', dist: { integrity: pkg.integrity, attestations: { url: 'https://registry.npmjs.org/proof' } } } } }
  const responses = [new Response('', { status: 503 }), new Response('{}', { status: 404 }), Response.json(published)]
  let calls = 0
  await readPublishedPackage(pkg, '2.0.0', async (_url, options) => {
    assert.ok(options.signal instanceof AbortSignal)
    calls++
    return responses.shift()
  }, async () => {})
  assert.equal(calls, 3)
  calls = 0
  published.versions['2.0.0'].dist.integrity = 'sha512-Yg=='
  await assert.rejects(readPublishedPackage(pkg, '2.0.0', async () => { calls++; return Response.json(published) }, async () => {}), /integrity differs/)
  assert.equal(calls, 1)
  calls = 0
  await assert.rejects(readPublishedPackage(pkg, '2.0.0', async () => { calls++; return new Response('{}', { status: 404 }) }, async () => {}), /Candidate version missing/)
  assert.equal(calls, 3)
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
  await rename(join(f.cwd, 'packages/a'), join(f.cwd, 'packages/source-a'))
  await rename(join(f.cwd, 'packages/b'), join(f.cwd, 'packages/source-b'))
  await rename(join(f.cwd, 'release-artifacts'), join(f.cwd, 'restored-evidence'))
  const restoredState = join(f.cwd, 'restored-evidence/promotion-state.json')
  const result = await recoverRelease({ root: f.cwd, stateFile: restoredState,
    channel: 'rc', environment: f.context.env, run: f.run, fetchMetadata: f.fetchMetadata,
    consumerProbe: async state => ({ version: state.version, revision: state.revision }) })
  assert.equal(result.channel, 'rc')
  assert.equal(f.calls.filter(args => args[0] === 'publish').length, 2)
  assert.equal(JSON.parse(await readFile(restoredState)).channels.rc.complete, true)
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
  f.registry.get('@fixture/a').versions['2.0.0'] = { version: '2.0.0' }
  await assert.rejects(f.promotion.verifyRelease(f.config, f.context), /before Git tagging/)
  assert.equal(f.calls.length, 0)
})

test('configured release places cohort promotion after every package and before GitHub', async () => {
  const { default: config } = await import('../release.config.js')
  const workspace = './scripts/semantic-release-workspace.mjs'
  const promotion = './scripts/semantic-release-promotion.mjs'
  const positions = config.plugins.map((plugin, index) => [Array.isArray(plugin) ? plugin[0] : plugin, index])
  const promoteAt = positions.find(([name]) => name === promotion)[1]
  assert.ok(positions.filter(([name]) => name === workspace).every(([, index]) => index < promoteAt))
  assert.equal(config.plugins.at(-2)[0], promotion)
  assert.equal(config.plugins.at(-1)[0], '@semantic-release/github')
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
