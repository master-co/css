import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import * as ts from 'typescript6'

const packagesRoot = path.resolve('packages')
const publicAPIContractPath = path.resolve('.ai/contracts/public-api.json')
const retiredDirectories = [
  'diagnostics',
  'engine',
  'facade',
  'integration',
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
const retiredPrivatePackageNames = new Set([
  '@master/css-build-internal',
  '@master/css-internal-integration'
])
const nativeTargetPattern = /^@master\/css-native-(?:darwin|linux|win32)-/
const publishedDependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies']
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
const requiredDefaultExportEntrypoints = new Set([
  '@master/css-astro:.',
  '@master/css-next:.',
  '@master/css-next:./adapter',
  '@master/css-nuxt:.',
  '@master/css-svelte:./vite',
  '@master/css-svelte-addon:.',
  '@master/css-vite:.',
  '@master/css-webpack:.',
  '@master/eslint-config-css:.',
  '@master/eslint-plugin-css:.'
])
const publicSourceRootByPackageName = new Map([
  ['@master/css-svelte', 'src/lib']
])

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

function resolveExportTarget(value) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return
  return value.types || value.import || value.browser || value.node || value.default
}

function resolvePublicSource(directory, packageName, target) {
  if (!target || !/\.(?:d\.ts|[cm]?[jt]sx?)$/.test(target)) return
  let relativeSource
  if (target.startsWith('./dist/')) {
    const sourceRoot = publicSourceRootByPackageName.get(packageName) || 'src'
    relativeSource = target
      .replace('./dist/', `${sourceRoot}/`)
      .replace(/\.d\.ts$/, '.ts')
      .replace(/\.js$/, '.ts')
  } else if (target.startsWith('./src/')) {
    relativeSource = target.slice(2)
  } else if (target.startsWith('./')) {
    relativeSource = target.slice(2)
  }
  if (!relativeSource) return
  for (const candidate of [
    path.join(packagesRoot, directory, relativeSource),
    path.join(packagesRoot, directory, relativeSource.replace(/\.ts$/, '.tsx'))
  ]) {
    if (existsSync(candidate)) return candidate
  }
}

function collectPublicSymbols(file) {
  const sourceFile = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  const symbols = new Set()
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      symbols.add('default')
      continue
    }
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        symbols.add('*')
        continue
      }
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          symbols.add(element.name.text)
        }
      } else {
        symbols.add(statement.exportClause.name.text)
      }
      continue
    }
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement) || []
      : []
    if (!modifiers.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)) continue
    if (modifiers.some(({ kind }) => kind === ts.SyntaxKind.DefaultKeyword)) {
      symbols.add('default')
      continue
    }
    if (statement.name && ts.isIdentifier(statement.name)) {
      symbols.add(statement.name.text)
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) symbols.add(declaration.name.text)
      }
    }
  }
  return [...symbols].sort()
}

function createPublicAPIContract(packages) {
  const contract = {}
  const observedDefaultExportEntrypoints = new Set()
  for (const { directory, manifest } of packages) {
    if (manifest.private) continue
    const symbols = {}
    for (const [subpath, value] of Object.entries(manifest.exports || {})) {
      const target = resolveExportTarget(value)
      const source = resolvePublicSource(directory, manifest.name, target)
      if (!source) {
        assert.equal(
          Boolean(target && /\.(?:d\.ts|[cm]?[jt]sx?)$/.test(target)),
          false,
          `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)} does not resolve to a public source file.`
        )
        continue
      }
      const entrySymbols = collectPublicSymbols(source)
      assert.equal(
        entrySymbols.includes('*'),
        false,
        `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)} must not use export *.`
      )
      const syncEntrypoint = subpath === './node'
        || subpath.endsWith('/node')
        || subpath.endsWith('/sync')
      for (const symbol of entrySymbols) {
        if (!symbol.endsWith('Sync')) continue
        assert.equal(
          syncEntrypoint,
          true,
          `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)} must expose ${symbol} from a Node sync entrypoint.`
        )
      }
      const entrypoint = `${manifest.name}:${subpath}`
      const hasDefaultExport = entrySymbols.includes('default')
      if (requiredDefaultExportEntrypoints.has(entrypoint)) {
        assert.equal(
          hasDefaultExport,
          true,
          `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)} must expose its ecosystem default export.`
        )
        observedDefaultExportEntrypoints.add(entrypoint)
      } else if (hasDefaultExport && !target.endsWith('.json.d.ts')) {
        assert.fail(`${manifest.name}${subpath === '.' ? '' : subpath.slice(1)} must use named exports.`)
      }
      symbols[subpath] = entrySymbols
    }
    contract[manifest.name] = {
      directory,
      exports: Object.keys(manifest.exports || {}).sort(),
      bins: Object.keys(manifest.bin || {}).sort(),
      entrypoints: symbols,
      surface: createHash('sha256')
        .update(JSON.stringify(symbols))
        .digest('hex')
        .slice(0, 16)
    }
  }
  assert.deepEqual(
    [...observedDefaultExportEntrypoints].sort(),
    [...requiredDefaultExportEntrypoints].sort(),
    'The required ecosystem default export entrypoints are incomplete.'
  )
  return contract
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
        retiredPackageNames.has(dependency) || retiredPrivatePackageNames.has(dependency),
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

  for (const field of publishedDependencyFields) {
    assert.equal(
      Object.hasOwn(manifest[field] ?? {}, '@master/css-internal'),
      false,
      `${manifest.name} must bundle the private internal package instead of publishing it in ${field}.`
    )
  }
}

for (const { manifest } of packages) {
  assert.equal(
    retiredPrivatePackageNames.has(manifest.name),
    false,
    `${manifest.name} is a retired private package identity.`
  )
}

const internalPackage = packages.find(({ manifest }) => manifest.name === '@master/css-internal')
assert.ok(internalPackage?.manifest.private, '@master/css-internal must remain repository-private.')
assert.equal(internalPackage.directory, 'internal', '@master/css-internal must remain in packages/internal.')
assert.equal(internalPackage.manifest.publishConfig, undefined, 'The private internal package must not have publish metadata.')

assert.equal(
  packages.some(({ manifest }) => manifest.name === '@master/eslint-config-css'),
  true,
  '@master/eslint-config-css must remain the official thin flat-config entrypoint.'
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

const publicAPIBaseline = JSON.parse(readFileSync(publicAPIContractPath, 'utf8'))
assert.equal(publicAPIBaseline.version, 1, 'Unsupported public API golden manifest version.')
const publicAPIContract = createPublicAPIContract(packages)
if (process.argv.includes('--write')) {
  writeFileSync(publicAPIContractPath, JSON.stringify({
    version: 1,
    packages: publicAPIContract
  }, null, 2) + '\n')
  process.stdout.write(`Updated ${publicAPIContractPath}.\n`)
} else {
  assert.deepEqual(
    publicAPIContract,
    publicAPIBaseline.packages,
    'Public package exports changed. Run "pnpm run check:packages:update" and review the golden manifest intentionally.'
  )
}

process.stdout.write(`Validated ${packages.length} package contract(s).\n`)
