import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { test } from 'node:test'
import { execa } from 'execa'
import { createWorkspaceRelease, packedManifest, validatePackedManifest } from './semantic-release-workspace.mjs'
import { assertNpmOidcEnvironment, createNpmOidcSession, npmRegistry } from './npm-oidc.mjs'

const githubEnv = {
  ...process.env,
  GITHUB_ACTIONS: 'true',
  GITHUB_SHA: 'a'.repeat(40),
  MASTER_CSS_RELEASE_STAGE: '1',
  ACTIONS_ID_TOKEN_REQUEST_URL: 'https://actions.example.test/oidc',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture-actions-request-token'
}
const revision = githubEnv.GITHUB_SHA

function archive(manifest) {
  const body = Buffer.from(JSON.stringify(manifest))
  const header = Buffer.alloc(512)
  header.write('package/package.json')
  header.write(body.length.toString(8).padStart(11, '0'), 124)
  return gzipSync(Buffer.concat([header, body, Buffer.alloc((512 - body.length % 512) % 512), Buffer.alloc(1024)]))
}

test('release versions all workspaces before packing and publishes verified tarballs with provenance', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bun-release-'))
  const roots = ['packages/a', 'packages/b']
  const calls = []
  const sessions = []
  const registry = new Map()
  const plugin = createWorkspaceRelease({
    fetchMetadata: async url => Response.json(registry.get(decodeURIComponent(url.split('/').at(-1))) ?? { versions: {}, 'dist-tags': {} }),
    run: async (command, args, options) => {
      calls.push({ command, args })
      if (command === 'npm') {
        const manifest = packedManifest(await readFile(args[1]))
        const { createHash } = await import('node:crypto')
        registry.set(manifest.name, { versions: { [manifest.version]: { ...manifest, dist: { integrity: `sha512-${createHash('sha512').update(await readFile(args[1])).digest('base64')}`, attestations: { url: 'https://registry.npmjs.org/fixture' } } } }, 'dist-tags': {} })
        sessions.push(options.cwd)
        assert.notEqual(options.cwd, cwd)
        assert.equal(options.extendEnv, false)
        assert.equal(options.preferLocal, false)
        assert.equal(options.env.NPM_TOKEN, undefined)
        assert.equal(await readFile(options.env.NPM_CONFIG_USERCONFIG, 'utf8'), '')
        assert.equal(await readFile(options.env.NPM_CONFIG_GLOBALCONFIG, 'utf8'), '')
        assert.equal(options.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, githubEnv.ACTIONS_ID_TOKEN_REQUEST_TOKEN)
        assert.equal(args[args.indexOf('--registry') + 1], npmRegistry)
      }
      if (command === 'bun') {
        for (const root of roots) assert.equal(JSON.parse(await readFile(join(cwd, root, 'package.json'))).version, '1.2.3')
        const manifest = JSON.parse(await readFile(join(options.cwd, 'package.json')))
        if (manifest.dependencies) manifest.dependencies['@fixture/b'] = '1.2.3'
        await writeFile(args[args.indexOf('--filename') + 1], archive(manifest))
      }
      return { stdout: '' }
    }
  })
  const context = { cwd, env: { ...githubEnv, NPM_TOKEN: 'must-not-be-used' }, nextRelease: { version: '1.2.3', channel: 'rc', gitHead: revision } }
  try {
    for (const [index, root] of roots.entries()) {
      await mkdir(join(cwd, root), { recursive: true })
      await writeFile(join(cwd, root, 'package.json'), JSON.stringify({ name: `@fixture/${index ? 'b' : 'a'}`, version: '0.0.0', publishConfig: { provenance: true }, ...(index ? {} : { dependencies: { '@fixture/b': 'workspace:*' } }) }))
    }
    const config = { pkgRoot: roots[0], workspaceRoots: roots }
    await plugin.verifyConditions(config, context)
    await plugin.prepare(config, context)
    await plugin.prepare({ ...config, pkgRoot: roots[1] }, context)
    await plugin.publish(config, context)
    const publish = calls.find(call => call.args[0] === 'publish')
    assert.equal(publish.command, 'npm')
    assert.ok(publish.args.includes('--provenance'))
    assert.equal(publish.args[publish.args.indexOf('--tag') + 1], 'candidate-1.2.3')
    assert.equal(packedManifest(await readFile(publish.args[1])).gitHead, revision)
    assert.equal(packedManifest(await readFile(publish.args[1])).dependencies['@fixture/b'], '1.2.3')
    await plugin.addChannel(config, context)
    assert.ok(!calls.some(call => call.command === 'npm' && call.args[0] === 'dist-tag'))
    assert.ok(calls.every(call => call.command !== 'pnpm'))
    assert.deepEqual(calls.filter(call => call.command === 'npm').map(call => call.args[0]), ['publish'])
    assert.equal(new Set(sessions).size, 1, 'every npm operation gets a fresh OIDC context')
    await plugin.success()
    for (const session of sessions) await assert.rejects(stat(session), { code: 'ENOENT' })
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('unresolved workspace dependencies and incorrect package identity fail validation', () => {
  assert.throws(() => validatePackedManifest({ name: 'a', version: '1', dependencies: { b: 'workspace:*' } }, 'a', '1'), /Unresolved workspace/)
  assert.throws(() => validatePackedManifest({ name: 'a', version: '0' }, 'a', '1'), /Incorrect release identity/)
  assert.throws(() => packedManifest(gzipSync(Buffer.alloc(1024))), /missing package/)
  for (const publishConfig of [{ _authToken: 'fixture' }, { userconfig: '/tmp/legacy.npmrc' }, { '@fixture:registry': 'https://example.test' }, { registry: 'https://example.test' }]) {
    assert.throws(() => validatePackedManifest({ name: 'a', version: '1', publishConfig }, 'a', '1'), /OIDC|official npm registry/)
  }
})

test('legacy tokens cannot substitute for GitHub OIDC identity', () => {
  for (const env of [
    {},
    { NPM_TOKEN: 'fixture-token', NODE_AUTH_TOKEN: 'fixture-token', NPM_ID_TOKEN: 'fixture-token' },
    { ...githubEnv, GITHUB_ACTIONS: 'false' },
    { ...githubEnv, ACTIONS_ID_TOKEN_REQUEST_URL: '' },
    { ...githubEnv, ACTIONS_ID_TOKEN_REQUEST_TOKEN: '' }
  ]) assert.throws(() => assertNpmOidcEnvironment(env), /requires GitHub Actions OIDC/)
})

test('real npm config loading ignores project, user, global and environment credentials', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-poisoned-npm-'))
  const originalToken = process.env.NPM_TOKEN
  let session
  try {
    const poison = join(cwd, 'legacy.npmrc')
    await writeFile(poison, '//registry.npmjs.org/:_authToken=fixture-file-token\nregistry=https://example.test\n')
    await writeFile(join(cwd, '.npmrc'), '//registry.npmjs.org/:_authToken=fixture-project-token\n')
    process.env.NPM_TOKEN = 'fixture-parent-token'
    session = await createNpmOidcSession({
      ...githubEnv, NPM_TOKEN: 'fixture-token', NODE_AUTH_TOKEN: 'fixture-node-token',
      NPM_ID_TOKEN: 'fixture-supplied-identity', npm_config_userconfig: poison,
      NPM_CONFIG_GLOBALCONFIG: poison, NPM_CONFIG_REGISTRY: 'https://example.test',
      'npm_config_//registry.npmjs.org/:_authToken': 'fixture-env-token'
    })
    const { cleanup, ...options } = session
    const child = await execa(process.execPath, ['-e', 'console.log(JSON.stringify({token:process.env.NPM_TOKEN,nodeToken:process.env.NODE_AUTH_TOKEN,identity:process.env.NPM_ID_TOKEN,oidc:!!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}))'], options)
    assert.deepEqual(JSON.parse(child.stdout), { oidc: true })
    const { stdout } = await execa('npm', ['config', 'list', '--json'], options)
    const config = JSON.parse(stdout)
    assert.equal(config.registry, npmRegistry)
    assert.equal(config.userconfig, session.env.NPM_CONFIG_USERCONFIG)
    assert.equal(config.globalconfig, session.env.NPM_CONFIG_GLOBALCONFIG)
    assert.ok(!Object.keys(config).some(key => /:_authToken$|:_password$|:username$/.test(key)))
    assert.ok(!stdout.includes('fixture-'), 'npm must not load any fixture credential')
    assert.equal((await stat(session.env.NPM_CONFIG_USERCONFIG)).mode & 0o777, 0o600)
    await cleanup()
    await assert.rejects(stat(session.cwd), { code: 'ENOENT' })
  } finally {
    if (originalToken === undefined) delete process.env.NPM_TOKEN
    else process.env.NPM_TOKEN = originalToken
    await session?.cleanup()
    await rm(cwd, { recursive: true, force: true })
  }
})

test('OIDC command failure propagates without retrying credentials or requiring a logger', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-oidc-failure-'))
  const sessions = [], calls = []
  const failure = new Error('Fixture: npm rejected the workflow OIDC identity')
  const plugin = createWorkspaceRelease({ fetchMetadata: async () => new Response('{}', { status: 404 }), run: async (command, args, options) => {
    calls.push(args[0])
    if (command === 'bun') {
      const manifest = JSON.parse(await readFile(join(options.cwd, 'package.json')))
      await writeFile(args[args.indexOf('--filename') + 1], archive(manifest))
      return { stdout: '' }
    }
    sessions.push(options.cwd)
    assert.equal(options.env.NPM_TOKEN, undefined)
    throw failure
  } })
  const config = { pkgRoot: '.', workspaceRoots: ['.'] }
  const context = { cwd, env: { ...githubEnv, NPM_TOKEN: 'unused' }, nextRelease: { version: '1.2.3', channel: 'site', gitHead: revision } }
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: '@fixture/a', version: '0.0.0' }))
    const local = { ...context, env: { NPM_TOKEN: 'unused' } }
    for (const operation of ['verifyConditions', 'publish']) {
      await assert.rejects(plugin[operation](config, local), /requires GitHub Actions OIDC/)
    }
    assert.deepEqual(calls, [], 'reject local publication before even packing')
    await plugin.verifyConditions(config, context)
    await assert.rejects(plugin.publish(config, context), error => error === failure)
    assert.equal(await plugin.addChannel(config, context), false)
    assert.deepEqual(calls, ['pm', 'publish'])
    for (const session of sessions) await assert.rejects(stat(session), { code: 'ENOENT' })
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('real Bun packing includes the release Git HEAD and resolves workspace protocols', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bun-real-pack-'))
  const roots = ['packages/a', 'packages/b']
  const plugin = createWorkspaceRelease({ run: (command, args, options) => {
    assert.equal(command, 'bun', 'this smoke must never publish')
    return execa(command, args, options)
  } })
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }))
    for (const [index, root] of roots.entries()) {
      await mkdir(join(cwd, root), { recursive: true })
      await writeFile(join(cwd, root, 'package.json'), JSON.stringify({ name: `@fixture/${index ? 'b' : 'a'}`, version: '0.0.0',
        ...(index ? {} : { dependencies: { '@fixture/b': 'workspace:*' }, peerDependencies: { '@fixture/b': 'workspace:^' },
          devDependencies: { '@fixture/internal': 'workspace:*' } }) }))
    }
    await mkdir(join(cwd, 'packages/internal'))
    await writeFile(join(cwd, 'packages/internal/package.json'), JSON.stringify({ name: '@fixture/internal', private: true }))
    await execa('git', ['init', '--quiet'], { cwd })
    await execa('git', ['add', '--all'], { cwd })
    await execa('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', '-c', 'commit.gpgsign=false',
      'commit', '--quiet', '--no-verify', '-m', 'Release source fixture'], { cwd })
    const { stdout: gitHead } = await execa('git', ['rev-parse', 'HEAD'], { cwd })
    const context = { cwd, env: process.env, nextRelease: { version: '3.2.1', gitHead } }
    await plugin.prepare({ pkgRoot: roots[0], workspaceRoots: roots }, context)
    const packed = packedManifest(await readFile(join(cwd, 'release-artifacts/packages/fixture-a-3.2.1.tgz')))
    assert.equal(packed.gitHead, gitHead)
    assert.equal(packed.dependencies['@fixture/b'], '3.2.1')
    assert.equal(packed.peerDependencies['@fixture/b'], '^3.2.1')
    assert.equal(packed.devDependencies, undefined)
    const manifestPath = join(cwd, roots[0], 'package.json')
    const manifest = JSON.parse(await readFile(manifestPath))
    manifest.dependencies['@fixture/internal'] = 'workspace:*'
    await writeFile(manifestPath, JSON.stringify(manifest))
    await assert.rejects(plugin.prepare({ pkgRoot: roots[0], workspaceRoots: roots }, context), /Failed to resolve workspace version for "@fixture\/internal" in `dependencies`/)
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('release packing rejects missing, abbreviated, or conflicting source identity', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bun-release-source-'))
  const manifestPath = join(cwd, 'package.json')
  const manifest = { name: '@fixture/a', version: '0.0.0', gitHead: 'b'.repeat(40) }
  const plugin = createWorkspaceRelease({ run: () => assert.fail('An unverified source must never be packed') })
  const config = { pkgRoot: '.', workspaceRoots: ['.'] }
  try {
    await writeFile(manifestPath, JSON.stringify(manifest))
    for (const gitHead of [undefined, revision.slice(0, 8)]) {
      await assert.rejects(plugin.prepare(config, { cwd, env: githubEnv, nextRelease: { version: '3.2.1', gitHead } }), /full source Git HEAD/)
    }
    await assert.rejects(plugin.prepare(config, { cwd, env: githubEnv, nextRelease: { version: '3.2.1', gitHead: revision } }), /Existing Git HEAD differs/)
    assert.equal(JSON.parse(await readFile(manifestPath)).gitHead, manifest.gitHead)
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('real release preparation excludes checkout artifacts from the generic binding archive', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-binding-release-'))
  const plugin = createWorkspaceRelease({ run: (command, args, options) => {
    assert.equal(command, 'bun', 'this check must never publish')
    return execa(command, args, options)
  } })
  try {
    const sourceManifest = JSON.parse(await readFile(new URL('../packages/binding/package.json', import.meta.url)))
    await mkdir(join(cwd, 'dist'))
    await mkdir(join(cwd, 'artifacts'))
    await writeFile(join(cwd, 'dist/index.js'), 'export {}\n')
    for (const file of ['mastercss.node', 'mcss', 'mcss.exe']) {
      await writeFile(join(cwd, 'artifacts', file), 'wrong-platform-development-binary')
    }
    const manifest = { name: sourceManifest.name, version: '0.0.0', files: sourceManifest.files }
    await writeFile(join(cwd, 'package.json'), JSON.stringify(manifest))
    const config = { pkgRoot: '.', workspaceRoots: ['.'] }
    const context = { cwd, env: process.env, nextRelease: { version: '3.2.1', gitHead: revision } }
    await plugin.prepare(config, context)
    const archive = join(cwd, 'release-artifacts/packages/master-css-binding-3.2.1.tgz')
    const files = (await execa('tar', ['-tzf', archive])).stdout.split('\n')
    assert.ok(files.includes('package/dist/index.js'))
    assert.ok(!files.some(file => file.includes('/artifacts/')))
    assert.equal(await readFile(join(cwd, 'artifacts/mastercss.node'), 'utf8'), 'wrong-platform-development-binary')

    // A future allowlist regression must fail in the actual release prepare path,
    // even if the metadata entry occurs before the native payload in the tarball.
    manifest.version = context.nextRelease.version
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ ...manifest, files: ['dist', 'artifacts'] }))
    await assert.rejects(plugin.prepare(config, context), /Generic @master\/css-binding tarball contains native artifact/)
    await writeFile(join(cwd, 'package.json'), JSON.stringify(manifest))
    await writeFile(join(cwd, 'dist/mastercss.node'), 'misplaced-native-binary')
    await assert.rejects(plugin.prepare(config, context), /Generic @master\/css-binding tarball contains native artifact/)
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('platform target archives retain their native addon and executable', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-binding-target-release-'))
  const plugin = createWorkspaceRelease({ run: (command, args, options) => {
    assert.equal(command, 'bun', 'this check must never publish')
    return execa(command, args, options)
  } })
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: '@master/css-binding-linux-x64-gnu', files: ['mastercss.node', 'mcss'] }))
    await writeFile(join(cwd, 'mastercss.node'), 'target-addon')
    await writeFile(join(cwd, 'mcss'), 'target-executable')
    await plugin.prepare({ pkgRoot: '.', workspaceRoots: ['.'] }, { cwd, env: process.env, nextRelease: { version: '3.2.1', gitHead: revision } })
    const files = (await execa('tar', ['-tzf', join(cwd, 'release-artifacts/packages/master-css-binding-linux-x64-gnu-3.2.1.tgz')])).stdout
    assert.ok(files.includes('package/mastercss.node'))
    assert.ok(files.includes('package/mcss'))
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})
