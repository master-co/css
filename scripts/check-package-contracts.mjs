import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const packagesRoot = path.resolve('packages')
const retiredDirectories = [
  'diagnostics',
  'engine',
  'facade',
  'language',
  'lexer',
  'lint',
  'project',
  'scanner',
  'source',
  'stylesheet',
  'validator'
]
const retiredPackageNames = new Set(retiredDirectories.map((name) => `@master/css-${name}`))
const nativeTargetPattern = /^@master\/css-native-(?:darwin|linux|win32)-/
const hostArtifactPackages = new Set([
  '@master/css-figma',
  '@master/css-vscode'
])
const packagesWithoutTypeDeclarations = new Set([
  '@master/css-cli',
  '@master/css-figma',
  '@master/css-preset',
  '@master/css-vscode'
])
const legacyEntrypointFields = ['main', 'module', 'jsnext:main', 'esnext']
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

function readPackage(directory) {
  const file = path.join(packagesRoot, directory, 'package.json')
  return {
    directory,
    file,
    manifest: JSON.parse(readFileSync(file, 'utf8'))
  }
}

function hasTypeDeclarationExport(exports) {
  return JSON.stringify(exports).includes('"types"')
}

for (const directory of retiredDirectories) {
  assert.equal(
    existsSync(path.join(packagesRoot, directory)),
    false,
    `Retired package directory packages/${directory} must not be restored.`
  )
}

const packages = readdirSync(packagesRoot)
  .filter((directory) => existsSync(path.join(packagesRoot, directory, 'package.json')))
  .map(readPackage)

for (const { directory, manifest } of packages) {
  assert.ok(manifest.name, `packages/${directory} must declare a package name.`)
  assert.equal(
    retiredPackageNames.has(manifest.name),
    false,
    `${manifest.name} is retired and must not be published.`
  )

  for (const field of dependencyFields) {
    for (const [dependency, range] of Object.entries(manifest[field] ?? {})) {
      assert.equal(
        retiredPackageNames.has(dependency),
        false,
        `${manifest.name} still depends on retired package ${dependency}.`
      )
      if (dependency.startsWith('@master/') && String(range).startsWith('workspace:')) {
        assert.equal(
          range,
          'workspace:*',
          `${manifest.name} must publish an exact lockstep range for ${dependency}.`
        )
      }
    }
  }

  if (manifest.private) continue

  assert.deepEqual(
    manifest.publishConfig,
    { access: 'public', provenance: true },
    `${manifest.name} must publish publicly with npm provenance.`
  )
  assert.equal(manifest.engines?.node, '^24', `${manifest.name} must declare the Node 24 baseline.`)
  assert.ok(Array.isArray(manifest.files) && manifest.files.length, `${manifest.name} must define a publish allowlist.`)
  assert.notEqual(manifest.exports, undefined, `${manifest.name} must define an explicit exports boundary.`)

  const isNativeTarget = nativeTargetPattern.test(manifest.name)
  assert.equal(
    manifest.type,
    isNativeTarget ? 'commonjs' : 'module',
    `${manifest.name} has an unexpected module type.`
  )

  if (manifest.name !== '@master/css-vscode') {
    for (const field of legacyEntrypointFields) {
      assert.equal(manifest[field], undefined, `${manifest.name} must not declare legacy ${field} metadata.`)
    }
  }

  if (!isNativeTarget && !hostArtifactPackages.has(manifest.name)) {
    assert.notEqual(manifest.sideEffects, undefined, `${manifest.name} must declare its side-effect contract.`)
  }

  if (!isNativeTarget && !packagesWithoutTypeDeclarations.has(manifest.name)) {
    assert.ok(
      manifest.types || hasTypeDeclarationExport(manifest.exports),
      `${manifest.name} must expose TypeScript declarations through exports.`
    )
  }

  assert.equal(
    Object.hasOwn(manifest.dependencies ?? {}, '@master/css-internal-integration'),
    false,
    `${manifest.name} must bundle the private integration module instead of publishing it as a dependency.`
  )
}

const integration = packages.find(({ manifest }) => manifest.name === '@master/css-internal-integration')?.manifest
assert.ok(integration?.private, '@master/css-internal-integration must remain repository-private.')
assert.equal(integration.publishConfig, undefined, 'The private integration package must not have publish metadata.')

const eslintConfig = packages.find(({ manifest }) => manifest.name === '@master/eslint-config-css')?.manifest
assert.equal(
  eslintConfig?.dependencies?.['@master/eslint-plugin-css'],
  'workspace:*',
  '@master/eslint-config-css must remain a deliberate public preset over the matching plugin version.'
)

const expectedAdapterNames = {
  astro: '@master/css-astro',
  figma: '@master/css-figma',
  next: '@master/css-next',
  nuxt: '@master/css-nuxt',
  svelte: '@master/css-svelte',
  vite: '@master/css-vite',
  vscode: '@master/css-vscode',
  webpack: '@master/css-webpack'
}
for (const [directory, name] of Object.entries(expectedAdapterNames)) {
  assert.equal(readPackage(directory).manifest.name, name, `packages/${directory} must use the normalized package name ${name}.`)
}

process.stdout.write(`Validated ${packages.length} package contract(s).\n`)
