import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { execa } from 'execa'
import { packedManifest } from './semantic-release-workspace.mjs'
import { releaseClosure, snapshotManifest, snapshotVersion, stageSnapshot } from './site-toolchain-snapshot.mjs'

const revision = 'f'.repeat(40)
const entry = (name, fields = {}) => ({ directory: name, manifest: { name, ...fields } })

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
  try {
    const directory = join(root, 'binding')
    await mkdir(join(directory, 'dist'), { recursive: true })
    await mkdir(join(directory, 'artifacts'))
    await writeFile(join(directory, 'dist/index.js'), 'export {}\n')
    await writeFile(join(directory, 'artifacts/mastercss.node'), 'wrong-platform-development-binary')
    const manifest = { name: '@master/css-binding', files: ['dist', 'artifacts'], exports: { '.': './dist/index.js' } }
    const entries = [{ directory, manifest }]
    const version = snapshotVersion(revision, '1')
    await assert.rejects(stageSnapshot(entries, join(root, 'rejected'), version, revision), /local development artifacts/)
    await rm(join(directory, 'artifacts'), { recursive: true })
    const stage = join(root, 'accepted')
    const roots = await stageSnapshot(entries, stage, version, revision)
    const archive = join(root, 'binding.tgz')
    await execa('bun', ['pm', 'pack', '--ignore-scripts', '--filename', archive], { cwd: join(stage, roots[0]) })
    const files = (await execa('tar', ['-tzf', archive])).stdout
    assert.ok(files.includes('package/dist/index.js'))
    assert.ok(!files.includes('artifacts/'))
  } finally { await rm(root, { recursive: true, force: true }) }
})
