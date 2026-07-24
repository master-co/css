import assert from 'node:assert/strict'
import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'

const packagesRoot = path.resolve('packages')
const apiCensusPath = path.resolve('.ai/contracts/api-census.json')
const textArtifactExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.json'])
const bindingTargetPattern = /^@master\/css-binding-(?:darwin|linux|win32)-/
const forbiddenSpecifierPattern = /@master\/(?:css-internal|css-build-internal|css-internal-integration|css-(?:diagnostics|engine|integration|language|lexer|lint|project|scanner|source|stylesheet|validator)|css\.(?:astro|figma|next|nuxt|svelte|vite|webpack)|css-vs-code)(?=$|[/'"?\s])/g
const forbiddenDeclarationPattern = /\b(?:[A-Za-z_$][\w$]*(?:IR|Ir)|Generated(?:Binding|Module|Session)[A-Za-z_$\d]*)\b/g
const moduleSpecifierPattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]([^'"]+)['"]/g
const nodeBuiltins = new Set(
  builtinModules.flatMap((name) => [
    name,
    name.startsWith('node:') ? name.slice(5) : `node:${name}`
  ])
)
const failures = []
let artifactCount = 0

function collectFiles(target) {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return [target]
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(target, entry.name)
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

function collectExportTargets(exports, targets = []) {
  if (typeof exports === 'string') {
    targets.push(exports)
  } else if (Array.isArray(exports)) {
    for (const value of exports) collectExportTargets(value, targets)
  } else if (exports && typeof exports === 'object') {
    for (const value of Object.values(exports)) collectExportTargets(value, targets)
  }
  return targets
}

function selectBrowserTarget(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const target = selectBrowserTarget(item)
      if (target) return target
    }
    return
  }
  if (!value || typeof value !== 'object') return
  if (value.browser) return selectBrowserTarget(value.browser)
  if (value.import) return selectBrowserTarget(value.import)
  if (value.default) return selectBrowserTarget(value.default)
}

function splitPackageSpecifier(specifier) {
  if (!specifier.startsWith('@')) {
    const [packageName, ...segments] = specifier.split('/')
    return {
      packageName,
      subpath: segments.length ? `./${segments.join('/')}` : '.'
    }
  }
  const segments = specifier.split('/')
  return {
    packageName: segments.slice(0, 2).join('/'),
    subpath: segments.length > 2 ? `./${segments.slice(2).join('/')}` : '.'
  }
}

function resolveRelativeArtifact(from, specifier) {
  const target = path.resolve(path.dirname(from), specifier)
  for (const candidate of [
    target,
    `${target}.js`,
    `${target}.mjs`,
    `${target}.cjs`,
    path.join(target, 'index.js')
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
}

function collectBrowserArtifactFailures(entrypoints, packageByName) {
  const visited = new Set()
  const visit = (file, entrypoint) => {
    if (!file || visited.has(file)) return
    visited.add(file)
    if (!/\.[cm]?js$/.test(file)) return
    const source = readFileSync(file, 'utf8')
    moduleSpecifierPattern.lastIndex = 0
    for (const match of source.matchAll(moduleSpecifierPattern)) {
      const specifier = match[1]
      if (nodeBuiltins.has(specifier)) {
        failures.push(`${entrypoint}: browser graph imports Node builtin ${specifier} through ${path.relative(process.cwd(), file)}`)
        continue
      }
      if (
        specifier.includes('native-loader')
        || specifier.endsWith('.node')
        || specifier.endsWith('/node')
      ) {
        failures.push(`${entrypoint}: browser graph imports native/Node entry ${specifier} through ${path.relative(process.cwd(), file)}`)
        continue
      }
      if (specifier.startsWith('.')) {
        visit(resolveRelativeArtifact(file, specifier), entrypoint)
        continue
      }
      const { packageName, subpath } = splitPackageSpecifier(specifier)
      const dependency = packageByName.get(packageName)
      if (!dependency) continue
      const target = selectBrowserTarget(dependency.manifest.exports?.[subpath])
      if (!target?.startsWith('./')) continue
      visit(path.resolve(dependency.root, target), entrypoint)
    }
  }
  for (const entrypoint of entrypoints) visit(entrypoint.file, entrypoint.id)
}

function collectReachableDeclarationFailures(entrypoints) {
  const visited = new Set()
  const visit = (file, entrypoint) => {
    if (!file || visited.has(file) || !file.endsWith('.d.ts')) return
    visited.add(file)
    const source = readFileSync(file, 'utf8')
    forbiddenDeclarationPattern.lastIndex = 0
    const forbidden = forbiddenDeclarationPattern.exec(source)
    if (forbidden) {
      failures.push(`${entrypoint}: public declarations expose internal symbol ${forbidden[0]} through ${path.relative(process.cwd(), file)}`)
    }
    moduleSpecifierPattern.lastIndex = 0
    for (const match of source.matchAll(moduleSpecifierPattern)) {
      if (!match[1].startsWith('.')) continue
      const target = path.resolve(path.dirname(file), match[1])
      const declaration = target.endsWith('.js')
        ? `${target.slice(0, -3)}.d.ts`
        : `${target}.d.ts`
      visit(existsSync(declaration) ? declaration : undefined, entrypoint)
    }
  }
  for (const entrypoint of entrypoints) visit(entrypoint.file, entrypoint.id)
}

assert.equal(existsSync(apiCensusPath), true, `API census ${apiCensusPath} must exist before artifact validation.`)
const apiCensus = JSON.parse(readFileSync(apiCensusPath, 'utf8'))
const browserSubpaths = new Set(
  apiCensus.records
    .filter(({ kind, platform }) =>
      kind === 'subpath'
      && ['browser', 'conditional', 'universal'].includes(platform)
    )
    .map(({ id }) => id)
)
const packageByName = new Map()
const browserEntrypoints = []
const declarationEntrypoints = []

for (const directory of readdirSync(packagesRoot)) {
  const packageRoot = path.join(packagesRoot, directory)
  const packageJSONPath = path.join(packageRoot, 'package.json')
  if (!existsSync(packageJSONPath)) continue

  const manifest = JSON.parse(readFileSync(packageJSONPath, 'utf8'))
  if (manifest.private) continue
  packageByName.set(manifest.name, { manifest, root: packageRoot })

  const exportTargets = [
    ...collectExportTargets(manifest.exports),
    manifest.types,
    manifest.style
  ].filter((target) => typeof target === 'string' && target.startsWith('./') && !target.includes('*'))

  for (const target of new Set(exportTargets)) {
    if (bindingTargetPattern.test(manifest.name)) continue
    if (!existsSync(path.resolve(packageRoot, target))) {
      failures.push(`${manifest.name}: exported artifact ${target} does not exist`)
    }
  }

  for (const [subpath, value] of Object.entries(manifest.exports || {})) {
    const browserTarget = selectBrowserTarget(value)
    if (
      browserSubpaths.has(`subpath:${manifest.name}:${subpath}`)
      && browserTarget?.startsWith('./')
      && /\.[cm]?js$/.test(browserTarget)
    ) {
      browserEntrypoints.push({
        id: `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)}`,
        file: path.resolve(packageRoot, browserTarget)
      })
    }
    const typeTarget = value && typeof value === 'object'
      ? value.types
      : subpath === '.' ? manifest.types : undefined
    if (typeof typeTarget === 'string' && typeTarget.startsWith('./')) {
      declarationEntrypoints.push({
        id: `${manifest.name}${subpath === '.' ? '' : subpath.slice(1)}`,
        file: path.resolve(packageRoot, typeTarget)
      })
    }
  }

  const excludedFiles = new Set((manifest.files ?? [])
    .filter((entry) => String(entry).startsWith('!'))
    .flatMap((entry) => globSync(String(entry).slice(1), { cwd: packageRoot }))
    .map((file) => path.join(packageRoot, file)))
  const publishedFiles = new Set((manifest.files ?? [])
    .filter((entry) => !String(entry).startsWith('!'))
    .flatMap((entry) => globSync(String(entry), { cwd: packageRoot }))
    .flatMap((target) => collectFiles(path.join(packageRoot, target))))

  for (const file of publishedFiles) {
    if (excludedFiles.has(file)) continue
    if (!textArtifactExtensions.has(path.extname(file))) continue
    artifactCount++
    const source = readFileSync(file, 'utf8')
    forbiddenSpecifierPattern.lastIndex = 0
    const match = forbiddenSpecifierPattern.exec(source)
    if (match) {
      failures.push(`${path.relative(process.cwd(), file)}: contains forbidden published specifier ${match[0]}`)
    }
  }
}

collectBrowserArtifactFailures(browserEntrypoints, packageByName)
collectReachableDeclarationFailures(declarationEntrypoints)

assert.equal(
  failures.length,
  0,
  `Published artifact contract violations:\n${failures.map((failure) => `- ${failure}`).join('\n')}`
)
process.stdout.write(`Validated ${artifactCount} published text artifact(s).\n`)
