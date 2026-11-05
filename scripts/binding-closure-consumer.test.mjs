import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { cleanEnvironment, installedLocations, verifyInstalledLock, verifyRevision } from './binding-closure-consumer.mjs'
import { prepareClosure } from './binding-closure-prepare.mjs'
import { packedManifest, validatePackedArchive } from './semantic-release-workspace.mjs'

test('consumer removes native and npm environment overrides', () => {
  const env = cleanEnvironment({ PATH: '/bin', MASTER_CSS_NATIVE_BINDING_PATH: '/checkout/addon',
    MASTER_CSS_NATIVE_CLI_PATH: '/checkout/cli', NODE_PATH: '/checkout/node_modules',
    NODE_OPTIONS: '--require /checkout/shim.js', npm_config_registry: 'https://wrong.example',
    NPM_CONFIG_CACHE: '/warm-cache', NPM_CONFIG_PREFIX: '/checkout' }, '/fresh-cache')
  assert.deepEqual(env, { PATH: '/bin', NPM_CONFIG_CACHE: '/fresh-cache',
    NPM_CONFIG_USERCONFIG: join('/fresh-cache', 'empty.npmrc'), NPM_CONFIG_GLOBALCONFIG: join('/fresh-cache', 'empty-global.npmrc') })
})

test('closure cannot be paired with a different candidate revision', () => {
  assert.throws(() => verifyRevision({ revision: 'abc123' }), /full commit SHA/)
  assert.throws(() => verifyRevision({ revision: 'a'.repeat(40) }, 'b'.repeat(40)), /same revision/)
  verifyRevision({ revision: 'a'.repeat(40) }, 'a'.repeat(40))
})

test('installed closure rejects missing, substituted and registry workspace packages', () => {
  const name = '@master/css-binding'
  const expected = new Map([[name, { version: '0.0.0-closure.1', integrity: 'sha512-candidate' }]])
  const names = new Set([name, '@master/css-binding-darwin-arm64'])
  const entry = { version: '0.0.0-closure.1', resolved: 'file:/candidate.tgz', integrity: 'sha512-candidate' }
  const lock = value => ({ packages: { [`node_modules/${name}`]: value } })
  const physical = new Set([`node_modules/${name}`])
  const verify = value => verifyInstalledLock(value, expected, names, physical)
  assert.deepEqual(verify(lock(entry)), [name])
  assert.throws(() => verify({ packages: {} }), /Candidate package missing/)
  assert.throws(() => verifyInstalledLock(lock(entry), expected, names, new Set()), /absent from disk/)
  assert.throws(() => verify(lock({ ...entry, version: '2.0.0' })), /Wrong installed version/)
  assert.throws(() => verify(lock({ ...entry, integrity: 'sha512-other' })), /Wrong installed archive integrity/)
  assert.throws(() => verify(lock({ ...entry, resolved: 'https://registry.npmjs.org/candidate.tgz' })), /came from a registry/)
  assert.throws(() => verify({ packages: { 'node_modules/@master/css-binding-darwin-arm64': entry } }), /Unexpected workspace package/)
})

test('npm 11.12 optional placeholders require known targets and no physical package or metadata', async () => {
  const root = await mkdtemp(join(tmpdir(), 'mastercss-optional-lock-'))
  const name = '@master/css-binding-darwin-x64'
  const location = `node_modules/@master/css-binding/node_modules/${name}`
  const names = new Set([name])
  const lock = { packages: { [location]: { optional: true } } }
  const verify = async (value = lock, targets = names) => verifyInstalledLock(value, new Map(), names,
    await installedLocations(root, value, names), targets)
  try {
    assert.deepEqual(await verify(), [])
    await assert.rejects(verify(lock, new Set()), /Unexpected workspace package installed/)
    for (const entry of [{}, { optional: false }, { optional: true, resolved: 'https://registry.npmjs.org/foreign.tgz' },
      { optional: true, integrity: 'sha512-foreign' }, { optional: true, version: '2.0.0' }]) {
      await assert.rejects(verify({ packages: { [location]: entry } }), /Unexpected optional target metadata/)
    }
    await mkdir(join(root, location), { recursive: true })
    await assert.rejects(verify(), /Unexpected workspace package on disk/)
    await rm(join(root, location), { recursive: true })
    // A top-level foreign package cannot hide behind an absent nested lock entry.
    await mkdir(join(root, 'node_modules', name), { recursive: true })
    await assert.rejects(verify(), /Unexpected workspace package on disk/)
    await rm(join(root, 'node_modules', name), { recursive: true })
    await symlink(join(root, 'missing-target'), join(root, location), 'junction')
    await assert.rejects(verify(), /Unexpected workspace package on disk/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'mastercss-closure-test-'))
  execFileSync('git', ['init', '--quiet', root])
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit', '--quiet', '--allow-empty', '--no-gpg-sign', '-m', 'Fixture'], { cwd: root })
  const targets = ['darwin-arm64', 'darwin-x64', 'linux-arm64-gnu', 'linux-arm64-musl',
    'linux-x64-gnu', 'linux-x64-musl', 'win32-arm64-msvc', 'win32-x64-msvc'].map(name => `@master/css-binding-${name}`)
  const dependency = names => Object.fromEntries(names.map(name => [name, 'workspace:*']))
  const manifests = [
    { name: '@master/css-schema' },
    ...['engine', 'compiler', 'tooling'].map(name => ({ name: `@master/css-binding-wasm-${name}`, dependencies: dependency(['@master/css-schema']) })),
    { name: '@master/css-binding', dependencies: dependency(['@master/css-schema', ...['engine', 'compiler', 'tooling'].map(name => `@master/css-binding-wasm-${name}`)]), optionalDependencies: dependency(targets) },
    { name: '@master/css-preset', dependencies: dependency(['@master/css-schema']) },
    { name: '@master/css', dependencies: dependency(['@master/css-binding', '@master/css-preset', '@master/css-schema']) },
    ...targets.map(name => ({ name }))
  ]
  for (const entry of manifests) {
    const directory = join(root, 'packages', entry.name.replace('@master/', ''))
    await mkdir(join(directory, 'dist'), { recursive: true })
    await writeFile(join(directory, 'dist/index.js'), 'export const fixture = true\n')
    await writeFile(join(directory, 'package.json'), JSON.stringify({ ...entry, type: 'module',
      files: ['dist'], exports: { '.': './dist/index.js' }, publishConfig: { access: 'public', provenance: true },
      repository: { type: 'git', url: 'https://github.com/master-co/css.git' } }))
  }
  return root
}

test('real release preparation excludes poisoned wrapper artifacts and pins its complete closure', async () => {
  const root = await fixture()
  try {
    const output = join(root, 'output')
    const manifest = await prepareClosure({ root, output, version: '0.0.0-closure.1' })
    assert.equal(manifest.packages.length, 7)
    assert.equal(manifest.targets.length, 8)
    assert.equal(manifest.poisonArtifactsExcluded, true)
    const binding = manifest.packages.find(entry => entry.name === '@master/css-binding')
    const archive = await readFile(join(output, binding.file))
    validatePackedArchive(archive, binding.name, manifest.version)
    assert.equal(Object.keys(packedManifest(archive).optionalDependencies).length, 8)
    assert.ok(Object.values(packedManifest(archive).optionalDependencies).every(version => version === manifest.version))

    const path = join(root, 'packages/css-binding/package.json')
    const unsafe = JSON.parse(await readFile(path, 'utf8'))
    unsafe.files.push('artifacts')
    await writeFile(path, JSON.stringify(unsafe))
    await assert.rejects(prepareClosure({ root, output: join(root, 'unsafe-output'), version: '0.0.0-closure.2' }), /Generic @master\/css-binding tarball contains native artifact/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
