import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { execa } from 'execa'
import { createWorkspaceRelease, packedManifest } from './semantic-release-workspace.mjs'
import { createSnapshot, releaseClosure, snapshotManifest, snapshotVersion, stageSnapshot } from './site-toolchain-snapshot.mjs'

const revision = 'f'.repeat(40)
const entry = (name, fields = {}) => ({ directory: name, manifest: { name, ...fields } })

test('snapshot publication rejects missing GitHub identity before reading or modifying the repository', async () => {
  const previous = process.env.GITHUB_ACTIONS
  try {
    process.env.GITHUB_ACTIONS = 'false'
    await assert.rejects(createSnapshot({ root: '/nonexistent-oidc-fixture', output: '/nonexistent-oidc-fixture', sequence: '1', publish: true }), /requires GitHub Actions OIDC/)
  } finally {
    if (previous === undefined) delete process.env.GITHUB_ACTIONS
    else process.env.GITHUB_ACTIONS = previous
  }
})

test('snapshot includes optional native packages and peers before consumers, excludes private build helpers', () => {
  const packages = new Map([
    ['site', entry('site', { dependencies: { core: 'workspace:*' }, peerDependencies: { grammar: 'workspace:^', astro: '^7' }, devDependencies: { helper: 'workspace:*' } })],
    ['core', entry('core', { optionalDependencies: { native: 'workspace:*' } })],
    ['native', entry('native')], ['grammar', entry('grammar')], ['helper', entry('helper', { private: true })]
  ])
  assert.deepEqual(releaseClosure(packages, ['site']).map(entry => entry.manifest.name), ['native', 'core', 'grammar', 'site'])
  packages.get('core').manifest.dependencies = { helper: 'workspace:*' }
  assert.throws(() => releaseClosure(packages, ['site']), /Private package/)
})

test('unresolved workspace dependencies and cycles cannot produce partial closures', () => {
  assert.throws(() => releaseClosure(new Map([['a', entry('a', { dependencies: { b: 'workspace:*' } })]]), ['a']), /Missing workspace/)
  assert.throws(() => releaseClosure(new Map([['a', entry('a', { dependencies: { a: 'workspace:*' } })]]), ['a']), /Circular/)
})

test('snapshot versions isolate prereleases and exact internal dependencies without changing source manifests', () => {
  const version = snapshotVersion(revision, '123.1')
  assert.equal(version, '0.0.0-site.123.1.gffffffffffff')
  assert.throws(() => snapshotVersion('rc', '1'), /full Git/)
  assert.throws(() => snapshotVersion(revision, 'latest'), /numeric/)
  const source = { name: 'a', scripts: { postinstall: 'bad' }, devDependencies: { private: 'workspace:*' }, dependencies: { b: 'workspace:^', external: '^1' }, peerDependencies: { b: 'workspace:*' } }
  const result = snapshotManifest(source, new Set(['a', 'b']), version, revision)
  assert.deepEqual(result.dependencies, { b: version, external: '^1' })
  assert.equal(result.peerDependencies.b, version)
  assert.equal(result.devDependencies, undefined)
  assert.equal(result.scripts, undefined)
  assert.equal(source.dependencies.b, 'workspace:^')
})

test('real packed snapshot installs exact manifests and only declared artifacts; source remains untouched', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-site-pack-'))
  try {
    const directory = join(root, 'source'), stage = join(root, 'stage')
    await mkdir(join(directory, 'dist'), { recursive: true })
    await writeFile(join(directory, 'dist/index.js'), 'export const value = 42\n')
    await writeFile(join(directory, 'draft.txt'), 'must not publish')
    const manifest = { name: '@fixture/site', files: ['dist'], exports: { '.': './dist/index.js' }, devDependencies: { helper: 'workspace:*' } }
    await writeFile(join(directory, 'package.json'), JSON.stringify(manifest))
    const version = snapshotVersion(revision, '1')
    const roots = await stageSnapshot([{ directory, manifest }], stage, version, revision)
    const archive = join(root, 'packed.tgz')
    await execa('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive], { cwd: join(stage, roots[0]) })
    assert.equal(packedManifest(await readFile(archive)).version, version)
    const files = (await execa('tar', ['-tzf', archive])).stdout
    assert.ok(files.includes('dist/index.js'))
    assert.ok(!files.includes('draft.txt'))
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'package.json'))), manifest)
    const consumer = join(root, 'consumer')
    await mkdir(consumer)
    await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { '@fixture/site': `file:${archive}` } }))
    await execa('bun', ['install', '--ignore-scripts'], { cwd: consumer })
    const result = await execa('bun', ['-e', 'import { value } from "@fixture/site"; console.log(value)'], { cwd: consumer })
    assert.equal(result.stdout.trim(), '42')
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('missing native artifacts fail before publication', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-site-native-'))
  try {
    await assert.rejects(stageSnapshot([{ directory: root, manifest: { name: 'native', files: ['mastercss.node', 'mcss'], exports: { '.': './mastercss.node' } } }], join(root, 'stage'), snapshotVersion(revision, '1'), revision), /Missing built export/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('a development binding cannot shadow the platform-specific release binaries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'master-site-development-binding-'))
  const plugin = createWorkspaceRelease({ run: (command, args, options) => {
    assert.equal(command, 'bun', 'this check must never publish')
    return execa(command, args, options)
  } })
  try {
    const directory = join(root, 'binding')
    await mkdir(join(directory, 'dist'), { recursive: true })
    await mkdir(join(directory, 'artifacts'))
    await writeFile(join(directory, 'dist/index.js'), 'export {}\n')
    await writeFile(join(directory, 'artifacts/mastercss.node'), 'wrong-platform-development-binary')
    const manifest = { name: '@master/css-binding', files: ['dist', 'artifacts'], exports: { '.': './dist/index.js' } }
    const entries = [{ directory, manifest }]
    const version = snapshotVersion(revision, '1')
    const rejected = join(root, 'rejected')
    const rejectedRoots = await stageSnapshot(entries, rejected, version, revision)
    await assert.rejects(plugin.prepare({ pkgRoot: rejectedRoots[0], workspaceRoots: rejectedRoots }, {
      cwd: rejected, env: process.env, nextRelease: { version }
    }), /Generic @master\/css-binding tarball contains native artifact/)
    manifest.files = ['dist']
    const stage = join(root, 'accepted')
    const roots = await stageSnapshot(entries, stage, version, revision)
    const archive = join(root, 'binding.tgz')
    await execa('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive], { cwd: join(stage, roots[0]) })
    const files = (await execa('tar', ['-tzf', archive])).stdout
    assert.ok(files.includes('package/dist/index.js'))
    assert.ok(!files.includes('artifacts/'))
    assert.equal(await readFile(join(directory, 'artifacts/mastercss.node'), 'utf8'), 'wrong-platform-development-binary')
  } finally { await plugin.fail(); await rm(root, { recursive: true, force: true }) }
})

test('snapshot publication requires both stage and promotion authorization before reading source', async () => {
  const keys = ['GITHUB_ACTIONS', 'ACTIONS_ID_TOKEN_REQUEST_URL', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'MASTER_CSS_RELEASE_STAGE', 'MASTER_CSS_RELEASE_PROMOTE']
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  try {
    Object.assign(process.env, { GITHUB_ACTIONS: 'true', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://fixture.invalid', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'fixture' })
    delete process.env.MASTER_CSS_RELEASE_STAGE
    delete process.env.MASTER_CSS_RELEASE_PROMOTE
    await assert.rejects(createSnapshot({ root: '/nonexistent-flag-fixture', output: '/nonexistent-flag-fixture', sequence: '1', publish: true }), /MASTER_CSS_RELEASE_STAGE/)
    process.env.MASTER_CSS_RELEASE_STAGE = '1'
    await assert.rejects(createSnapshot({ root: '/nonexistent-flag-fixture', output: '/nonexistent-flag-fixture', sequence: '1', publish: true }), /MASTER_CSS_RELEASE_PROMOTE/)
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  }
})
