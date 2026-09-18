/** @internal Node filesystem and package inputs for the Rust import graph. */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@master/css'
const MASTER_CSS_PACKAGE_IDS = new Set([MASTER_CSS_PACKAGE_ID, '@master/css-preset'])

interface CSSPackageJSON {
  name?: unknown
  style?: unknown
  exports?: unknown
}

export interface PrepareCSSImportGraphOptions {
  projectDir?: string
  expandPackageImports?: boolean
  onDependency?: (file: string) => void
  resolveNodePackageImports?: boolean
  signal?: AbortSignal
  baseFile?: string
  sourceMap?: string
}

type AnalyzeDependencies = (source: string) => { imports: { source: string }[] }

/** Source supplied by a host loader; virtual IDs retain their null prefix. */
export interface CSSImportSource {
  readonly id: string
  readonly source: string
  /** Real source owner for relative imports, references, resource URLs and source patterns, if any. */
  readonly baseFile?: string
  /** Serialized source map v3 for original reference origins in prepared CSS. */
  readonly sourceMap?: string
}

/** undefined uses Node fallback; null preserves an external import verbatim. */
export type CSSImportFileResolver = (specifier: string, importer: string) =>
  string | CSSImportSource | null | undefined | Promise<string | CSSImportSource | null | undefined>

export function normalizeStylesheetGraphID(id: string) {
  return id.startsWith('\0') ? id : resolve(id)
}

export function isExpandableImportSource(source: string, fromFile: string) {
  if (source.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(source)) return false
  if (extname(decodeURIComponent(new URL(source, 'file:///').pathname)).toLowerCase() !== '.css') return false
  return source.startsWith('./') || source.startsWith('../') || existsSync(resolveRelativeCSSFile(source, fromFile))
}

export function resolveRelativeCSSFile(source: string, fromFile: string) {
  // CSS URLs use URL pathname encoding and request suffixes; the Node host owns
  // mapping these decoded CSS specifiers to local filesystem names.
  return fileURLToPath(new URL(source, pathToFileURL(fromFile)))
}

function readJSONFile<T>(file: string) {
  return JSON.parse(readFileSync(file, 'utf-8')) as T
}

function findPackageRoot(entryFile: string, packageName: string) {
  let directory = dirname(entryFile)
  while (true) {
    const packageJSONFile = resolve(directory, 'package.json')
    if (existsSync(packageJSONFile)) {
      try {
        const packageJSON = readJSONFile<CSSPackageJSON>(packageJSONFile)
        if (packageJSON.name === packageName) {
          return {
            directory,
            packageJSON
          }
        }
      } catch {
        // Keep walking up in case this is not the package root.
      }
    }
    const parentDirectory = dirname(directory)
    if (parentDirectory === directory) return
    directory = parentDirectory
  }
}

function resolvePackageDirectory(directory: string) {
  try {
    return realpathSync(directory)
  } catch {
    return directory
  }
}

function findNodeModulesPackageRoot(baseDirectory: string, packageName: string) {
  let directory = resolve(baseDirectory)
  const packagePath = packageName.split('/')
  while (true) {
    const packageJSONFile = resolve(directory, 'node_modules', ...packagePath, 'package.json')
    if (existsSync(packageJSONFile)) {
      try {
        const packageJSON = readJSONFile<CSSPackageJSON>(packageJSONFile)
        if (packageJSON.name === packageName) {
          return {
            directory: resolvePackageDirectory(dirname(packageJSONFile)),
            packageJSON
          }
        }
      } catch {
        // Keep walking up in case this is not the package root.
      }
    }
    const parentDirectory = dirname(directory)
    if (parentDirectory === directory) return
    directory = parentDirectory
  }
}

function resolvePackageRoot(packageName: string, fromFile: string, projectDir?: string) {
  const resolvedFromFile = resolve(projectDir || '', fromFile)
  const searchDirectories = [
    projectDir,
    resolvedFromFile,
    dirname(resolvedFromFile),
    process.cwd()
  ].filter((directory): directory is string => typeof directory === 'string')

  for (const directory of new Set(searchDirectories)) {
    const packageRoot = findNodeModulesPackageRoot(directory, packageName)
    if (packageRoot) return packageRoot
  }

  const resolver = createProjectRequire(fromFile, projectDir)
  let packageEntryFile: string
  try {
    packageEntryFile = resolver.resolve(packageName)
  } catch {
    packageEntryFile = require.resolve(packageName)
  }
  return findPackageRoot(packageEntryFile, packageName)
}

function getPackageStyleEntry(packageJSON: CSSPackageJSON) {
  if (typeof packageJSON.style === 'string') return packageJSON.style
  if (!packageJSON.exports || typeof packageJSON.exports !== 'object') return
  const rootExport = (packageJSON.exports as Record<string, unknown>)['.']
  if (!rootExport || typeof rootExport !== 'object') return
  const styleExport = (rootExport as Record<string, unknown>).style
  return typeof styleExport === 'string' ? styleExport : undefined
}

function createProjectRequire(fromFile: string, projectDir?: string) {
  return createRequire(resolve(projectDir || dirname(fromFile), 'package.json'))
}

export function resolveMasterCSSPackageEntryFile(importSource: string, fromFile = process.cwd(), projectDir?: string) {
  if (!MASTER_CSS_PACKAGE_IDS.has(importSource)) return
  const packageRoot = resolvePackageRoot(importSource, fromFile, projectDir)
  if (!packageRoot) return
  const styleEntry = getPackageStyleEntry(packageRoot.packageJSON)
  if (!styleEntry) return
  const styleFile = resolve(packageRoot.directory, styleEntry)
  if (!existsSync(styleFile)) {
    throw new Error(`${importSource} CSS style entry was not found: ${styleFile}`)
  }
  return styleFile
}

export interface PreparedCSSImportGraph {
  entry: string
  files: Record<string, string>
  edges: { from: string, specifier: string, resolved: string }[]
  /** Node package CSS keeps its native rules when a surrounding project is pruned. */
  packageFiles?: string[]
  baseFiles?: Record<string, string>
  sourceMaps?: Record<string, string>
}

function resolveNodePackageCSS(importSource: string, fromFile: string) {
  if (importSource.startsWith('.') || importSource.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(importSource)) return
  try {
    const file = createRequire(fromFile).resolve(importSource)
    if (extname(file).toLowerCase() === '.css') return file
  } catch {
    // Unresolved specifiers remain external; a build host can report its policy.
  }
}

/** A bare alias is not package ownership; verify the resolved file's package root. */
function isResolvedPackageCSS(specifier: string, importer: string, file: string, projectDir?: string) {
  if (specifier.startsWith('.') || specifier.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(specifier)) return false
  const packageName = specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/')
  try {
    const root = resolvePackageRoot(packageName, importer, projectDir)
    if (!root) return false
    const path = relative(resolvePackageDirectory(root.directory), resolvePackageDirectory(file))
    return path !== '..' && !path.startsWith('../') && !path.startsWith('..\\') && !isAbsolute(path)
  } catch {
    return false
  }
}

function resolvePreparedImport(importSource: string, file: string, options: PrepareCSSImportGraphOptions) {
  const packageFile = options.expandPackageImports !== false
    ? resolveMasterCSSPackageEntryFile(importSource, file, options.projectDir) : undefined
  const nodePackageFile = !packageFile && options.resolveNodePackageImports ? resolveNodePackageCSS(importSource, file) : undefined
  if (packageFile || nodePackageFile || isExpandableImportSource(importSource, file)) {
    return { file: packageFile || nodePackageFile || resolveRelativeCSSFile(importSource, file), packageCSS: Boolean(nodePackageFile) }
  }
}

function prepareCSSImportGraphFile(
  file: string,
  graph: PreparedCSSImportGraph,
  visited: Set<string>,
  options: PrepareCSSImportGraphOptions,
  sourceOverride: string | undefined,
  analyzeDependencies: AnalyzeDependencies,
  packageCSS = false
): void {
  const absoluteFile = resolve(file)
  options.onDependency?.(absoluteFile)
  if (packageCSS && !graph.packageFiles?.includes(absoluteFile)) (graph.packageFiles ??= []).push(absoluteFile)
  if (sourceOverride === undefined && !existsSync(absoluteFile)) {
    throw new Error(`CSS file not found: ${absoluteFile}`)
  }
  if (visited.has(absoluteFile)) return
  visited.add(absoluteFile)

  const source = sourceOverride ?? readFileSync(absoluteFile, 'utf-8')
  graph.files[absoluteFile] = source
  const analysis = analyzeDependencies(source)
  for (const importStatement of analysis.imports) {
    const importSource = importStatement.source
    const imported = resolvePreparedImport(importSource, absoluteFile, options)
    if (imported) {
      const importedFile = imported.file
      graph.edges.push({
        from: absoluteFile,
        specifier: importSource,
        resolved: importedFile
      })
      prepareCSSImportGraphFile(importedFile, graph, visited, options, undefined, analyzeDependencies, packageCSS || imported.packageCSS)
    }
  }
}

export function prepareCSSImportGraph(
  file: string,
  source: string | undefined,
  options: PrepareCSSImportGraphOptions,
  analyzeDependencies: AnalyzeDependencies
): PreparedCSSImportGraph {
  const graph: PreparedCSSImportGraph = { entry: resolve(file), files: {}, edges: [] }
  prepareCSSImportGraphFile(graph.entry, graph, new Set(), options, source, analyzeDependencies)
  return graph
}

/** Async build-host file resolution, sharing Node fallback and Rust dependency analysis. */
export async function prepareCSSImportGraphWithResolver(
  file: string, source: string, options: PrepareCSSImportGraphOptions,
  analyzeDependencies: AnalyzeDependencies, resolveImport: CSSImportFileResolver
): Promise<PreparedCSSImportGraph> {
  const graph: PreparedCSSImportGraph = { entry: normalizeStylesheetGraphID(file), files: {}, edges: [] }
  if (options.sourceMap) graph.sourceMaps = { [graph.entry]: options.sourceMap }
  if (options.baseFile) {
    if (!isAbsolute(options.baseFile)) throw new TypeError('A stylesheet source baseFile must be an absolute filesystem path.')
    graph.baseFiles = { [graph.entry]: options.baseFile }
  }
  const pending = [{ file: graph.entry, source: source as string | undefined, packageCSS: false }]
  const visited = new Set<string>()
  while (pending.length) {
    options.signal?.throwIfAborted()
    const item = pending.pop()!
    options.onDependency?.(item.file)
    if (item.packageCSS && !graph.packageFiles?.includes(item.file)) (graph.packageFiles ??= []).push(item.file)
    if (visited.has(item.file)) continue
    visited.add(item.file)
    const text = item.source ?? readFileSync(item.file, 'utf8')
    graph.files[item.file] = text
    const children: typeof pending = []
    for (const { source: specifier } of analyzeDependencies(text).imports) {
      const resolved = await resolveImport(specifier, item.file)
      options.signal?.throwIfAborted()
      if (resolved === null) continue
      const supplied = typeof resolved === 'object' ? resolved : undefined
      const id = supplied?.id ?? resolved
      if (typeof id === 'string' && !isAbsolute(id) && !(supplied && id.startsWith('\0'))) throw new TypeError('A stylesheet import resolver must return an absolute filesystem path or a source with a virtual ID.')
      if (supplied?.baseFile && !isAbsolute(supplied.baseFile)) throw new TypeError('A stylesheet source baseFile must be an absolute filesystem path.')
      const importer = graph.baseFiles?.[item.file] ?? item.file
      const owner = supplied?.baseFile ?? (id as string)
      const imported = resolved === undefined ? resolvePreparedImport(specifier, importer, options)
        : { file: normalizeStylesheetGraphID(id as string), packageCSS: isAbsolute(owner) && isResolvedPackageCSS(specifier, importer, owner, options.projectDir) }
      if (!imported) continue
      if (supplied?.baseFile) (graph.baseFiles ??= {})[imported.file] = supplied.baseFile
      if (supplied?.sourceMap) (graph.sourceMaps ??= {})[imported.file] = supplied.sourceMap
      graph.edges.push({ from: item.file, specifier, resolved: imported.file })
      children.push({ file: imported.file, source: supplied?.source, packageCSS: item.packageCSS || imported.packageCSS })
    }
    pending.push(...children.reverse())
  }
  return graph
}
