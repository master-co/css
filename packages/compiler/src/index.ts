import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { transform } from 'lightningcss'
import { loadNativeBinding } from '@master/css-native'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type { CSSDirectiveReference } from '@master/css-schema/css-directives'
import { MASTER_CSS_ENTRY_DIRECTIVE_NAME } from '@master/css-lexer'
import lowerCSSDirectives from './lower-css-directives'
import type { CompilerDiagnosticRecorder } from './diagnostics'
import {
  createCSSDirectiveExtractionPolicy,
  findStandaloneMasterDirectiveStatements,
  mergeCSSDirectiveExtractionPolicy,
  removeCSSReferenceStatements,
  type CompileCSSOptions,
  setCSSTransform,
  type CSSReferenceStatement,
  type CompileCSSFileOptions,
  type CompileCSSResult,
  type ResolvedCSSImportGraph
} from './core'
import {
  findCSSImportStatements
} from './lexer/imports'

export * from './core'
export type {
  CompileCSSFileOptions,
  CompileCSSOptions,
  CompileCSSResult,
  CSSReferenceStatement,
  ResolvedCSSImportGraph,
  StandaloneCSSDirectiveStatement,
  StandaloneMasterDirectiveStatement
} from './core'

setCSSTransform(transform)

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@master/css'
const MASTER_CSS_PACKAGE_IDS = new Set([MASTER_CSS_PACKAGE_ID, '@master/css-preset'])

interface CSSPackageJSON {
  name?: unknown
  style?: unknown
  exports?: unknown
}

export interface InspectCSSResult {
  hasMasterEntryDirective: boolean
  hasMasterCSSImport: boolean
  hasMasterEntry: boolean
}

export interface ResolveCSSImportGraphOptions {
  projectDir?: string
  expandPackageImports?: boolean
  onReference?: (reference: CSSReferenceStatement, fromFile: string) => void
}

export type CompileCSSManifestOptions = CompileCSSFileOptions & {
  baseManifest?: MasterCSSManifest
}
export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
  baseManifest?: MasterCSSManifest
  root?: string
}

type CompileCSSManifestInternalOptions = CompileCSSManifestSourceOptions & {
  referenceStack?: string[]
  diagnostics?: CompilerDiagnosticRecorder
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  directives: CompileCSSResult
}

export interface CompileProjectManifestResult extends CompileCSSManifestResult {
  entries: string[]
}

export type CompileCSSManifestJSONResult = CompileCSSManifestResult & {
  json: string
  directives: CompileCSSResult
}

export class CSSCompilerError extends Error {
  readonly source?: string
  readonly range?: { start: number, end: number }
  readonly notes?: string[]

  constructor(
    public readonly code: string,
    message: string,
    diagnostic: {
      source?: string
      range?: { start: number, end: number }
      notes?: string[]
    } = {},
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'CSSCompilerError'
    this.source = diagnostic.source
    this.range = diagnostic.range
    this.notes = diagnostic.notes
  }
}

function throwCompilerBindingError(error: unknown): never {
  const rawMessage = error instanceof Error ? error.message : String(error)
  try {
    const diagnostic = JSON.parse(rawMessage) as {
      code?: string
      message?: string
      source?: string
      range?: { start: number, end: number }
      notes?: string[]
    }
    if (diagnostic && typeof diagnostic.message === 'string') {
      const legacyCode = diagnostic.message === '@compose only accepts unquoted class lists'
        ? 'compose-quoted-syntax'
        : diagnostic.message === '@compose does not accept group syntax'
          ? 'compose-group-syntax'
          : undefined
      throw new CSSCompilerError(legacyCode || diagnostic.code || 'CSS_COMPILER_ERROR', diagnostic.message, diagnostic, {
        cause: error
      })
    }
  } catch (parsedError) {
    if (parsedError instanceof CSSCompilerError) throw parsedError
  }
  throw error
}

function callCompilerBindingJSON<T>(call: () => string): T {
  try {
    return JSON.parse(call()) as T
  } catch (error) {
    throwCompilerBindingError(error)
  }
}

function isExpandableImportSource(source: string) {
  return (source.startsWith('./') || source.startsWith('../')) && extname(source) === '.css'
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

export function inspectCSS(source: string): InspectCSSResult {
  const hasMasterEntryDirective = findStandaloneMasterDirectiveStatements(source)
    .some((statement) => statement.name === MASTER_CSS_ENTRY_DIRECTIVE_NAME)
  const hasMasterCSSImport = findCSSImportStatements(source)
    .some((statement) => statement.source === MASTER_CSS_PACKAGE_ID)
  return {
    hasMasterEntryDirective,
    hasMasterCSSImport,
    hasMasterEntry: hasMasterEntryDirective || hasMasterCSSImport
  }
}

interface PreparedCSSImportGraph {
  entry: string
  files: Record<string, string>
  edges: { from: string, specifier: string, resolved: string }[]
}

function prepareCSSImportGraphFile(
  file: string,
  graph: PreparedCSSImportGraph,
  visited: Set<string>,
  options: ResolveCSSImportGraphOptions = {}
): void {
  const absoluteFile = resolve(file)
  if (!existsSync(absoluteFile)) {
    throw new Error(`CSS manifest entry file not found: ${absoluteFile}`)
  }
  if (visited.has(absoluteFile)) return
  visited.add(absoluteFile)

  const source = readFileSync(absoluteFile, 'utf-8')
  graph.files[absoluteFile] = source
  const sourceWithoutReferences = removeCSSReferenceStatements(source, absoluteFile)
  const imports = findCSSImportStatements(sourceWithoutReferences, absoluteFile)
  for (const importStatement of imports) {
    const importSource = importStatement.source
    const packageFile = options.expandPackageImports !== false
      ? resolveMasterCSSPackageEntryFile(importSource, absoluteFile, options.projectDir)
      : undefined
    if (packageFile || isExpandableImportSource(importSource)) {
      const importedFile = packageFile || resolve(dirname(absoluteFile), importSource)
      graph.edges.push({
        from: absoluteFile,
        specifier: importSource,
        resolved: importedFile
      })
      prepareCSSImportGraphFile(importedFile, graph, visited, options)
    }
  }
}

export function resolveCSSImportGraph(file: string, options: ResolveCSSImportGraphOptions = {}): ResolvedCSSImportGraph {
  const entry = resolve(file)
  const graph: PreparedCSSImportGraph = {
    entry,
    files: {},
    edges: []
  }
  prepareCSSImportGraphFile(entry, graph, new Set(), options)
  const binding = loadNativeBinding({ required: true })!.binding
  const result = callCompilerBindingJSON<ResolvedCSSImportGraph>(() => (
    binding.resolveCssImportGraphJson(JSON.stringify(graph))
  ))
  for (const reference of result.references || []) {
    options.onReference?.(reference as CSSReferenceStatement, reference.file || entry)
  }
  return result
}

export function resolveMasterCSSPackageImportGraph(projectDir?: string) {
  const entry = resolveMasterCSSPackageEntryFile(MASTER_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
  if (!entry) {
    throw new Error(`Cannot resolve ${MASTER_CSS_PACKAGE_ID} CSS entry.`)
  }
  return resolveCSSImportGraph(entry, {
    projectDir
  })
}

function stripRequest(id: string) {
  return id.replace(/[?#].*$/, '')
}

function resolveComparablePath(file: string) {
  const filename = resolve(file)
  try {
    return realpathSync(filename)
  } catch {
    return filename
  }
}

export function isMasterCSSPackageStyleFile(id: string, projectDir?: string) {
  const filename = resolveComparablePath(stripRequest(id))
  if (extname(filename) !== '.css') return false
  try {
    return resolveMasterCSSPackageImportGraph(projectDir).dependencies.some((dependency) => {
      return resolveComparablePath(dependency) === filename
    })
  } catch {
    return false
  }
}

export function compileCSSFile(file: string, options: CompileCSSFileOptions = {}): CompileCSSResult {
  const { root, ...compileOptions } = options
  const absoluteFile = isAbsolute(file) ? file : resolve(root || '', file)
  const graph = resolveCSSImportGraph(absoluteFile, {
    projectDir: root
  })
  const result = compileCSS(graph.source, {
    ...compileOptions,
    from: absoluteFile
  })
  return {
    ...result,
    dependencies: graph.dependencies,
    ...(graph.references?.length ? { references: graph.references } : {})
  }
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
  const binding = loadNativeBinding({ required: true })!.binding
  const result = reviveRustCompileResult(callCompilerBindingJSON<CompileCSSResult>(() => (
    binding.compileCssDirectivesJson(
      source,
      JSON.stringify({
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      })
    )
  )))
  for (const warning of result.warnings) options.onWarning?.(warning)
  return result
}

function reviveRustCompileResult(result: CompileCSSResult): CompileCSSResult {
  result.extractionPolicy.blocklist = result.extractionPolicy.blocklist.map((entry) => {
    if (
      entry
      && typeof entry === 'object'
      && 'source' in entry
      && typeof entry.source === 'string'
    ) {
      return new RegExp(entry.source, 'flags' in entry && typeof entry.flags === 'string' ? entry.flags : '')
    }
    return entry
  })
  return result
}

function compileManifestInputWithRust(
  input: CompileCSSResult['manifestInput'],
  baseManifest: MasterCSSManifest | undefined
) {
  const binding = loadNativeBinding({ required: true })!.binding
  return callCompilerBindingJSON<{ manifest: MasterCSSManifest }>(() => (
    binding.compileManifestInputJson(
      JSON.stringify(input),
      baseManifest ? JSON.stringify({ baseManifest }) : undefined
    )
  )).manifest
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
  if (!values) return
  for (const value of values) {
    if (!target.includes(value)) target.push(value)
  }
}

function resolveCSSReferenceFile(reference: CSSDirectiveReference, options: CompileCSSManifestSourceOptions = {}) {
  const fromFile = reference.file
    ? isAbsolute(reference.file)
      ? reference.file
      : resolve(options.root || '', reference.file)
    : resolve(options.root || process.cwd(), 'master.css')
  const packageFile = resolveMasterCSSPackageEntryFile(reference.source, fromFile, options.root)
  if (packageFile) return packageFile
  if (isExpandableImportSource(reference.source)) return resolve(dirname(fromFile), reference.source)
  throw new Error(`@reference only supports relative CSS files or Master CSS package entries: ${reference.source}`)
}

function normalizeReferenceStack(stack: string[] | undefined) {
  return (stack || []).map((file) => resolveComparablePath(file))
}

function resolveCSSReferenceContext(
  references: CSSDirectiveReference[] | undefined,
  options: CompileCSSManifestInternalOptions = {}
) {
  const dependencies: string[] = []
  const warnings: string[] = []
  let manifest = options.baseManifest
  let hasReferences = false

  for (const reference of references || []) {
    const referenceFile = resolveCSSReferenceFile(reference, options)
    const comparableReferenceFile = resolveComparablePath(referenceFile)
    const stack = normalizeReferenceStack(options.referenceStack)
    if (stack.includes(comparableReferenceFile)) {
      throw new Error(`Circular CSS reference: ${[...(options.referenceStack || []), referenceFile].join(' -> ')}`)
    }
    const result = compileCSSManifestFileInternal(referenceFile, {
      ...options,
      baseManifest: manifest,
      preserveNativeCSS: false,
      referenceStack: options.referenceStack
    })
    hasReferences = true
    manifest = result.manifest
    addUnique(dependencies, result.dependencies)
    addUnique(warnings, result.warnings)
  }

  return {
    dependencies,
    warnings,
    ...(hasReferences ? { manifest } : {})
  }
}

function toCompileCSSManifestResult(
  result: CompileCSSResult,
  options: CompileCSSManifestInternalOptions = {}
): CompileCSSManifestResult {
  const { manifestInput: _directiveManifestInput, ...directiveData } = result
  const referenceContext = resolveCSSReferenceContext(result.references, options)
  const lowerResult = lowerCSSDirectives(result, {
    baseManifest: options.baseManifest,
    resolutionManifest: referenceContext.manifest,
    onWarning: options.onWarning,
    diagnostics: options.diagnostics
  })
  const dependencies: string[] = []
  const warnings: string[] = []
  addUnique(dependencies, result.dependencies)
  addUnique(dependencies, referenceContext.dependencies)
  addUnique(warnings, referenceContext.warnings)
  addUnique(warnings, lowerResult.warnings)
  const generatedCSS = lowerResult.generatedCSS || ''
  const css = [
    result.nativeCSS,
    generatedCSS
  ].filter(Boolean).join('\n')
  return {
    ...directiveData,
    dependencies,
    manifest: compileManifestInputWithRust(lowerResult.input, options.baseManifest),
    resolutionManifest: lowerResult.resolutionManifest,
    warnings,
    generatedCSS,
    css,
    directives: result
  }
}

export function createManifestFromCSSResult(
  result: CompileCSSResult,
  options: CompileCSSManifestSourceOptions = {}
) {
  return toCompileCSSManifestResult(result, options)
}

export function compileCSSManifest(source: string, options: CompileCSSManifestSourceOptions = {}): CompileCSSManifestResult {
  const from = options.from ? stripRequest(options.from) : undefined
  const fromFile = from ? isAbsolute(from) ? from : resolve(options.root || '', from) : undefined
  const result = compileCSS(source, {
    ...options,
    ...(fromFile ? { from: fromFile } : {})
  })
  return toCompileCSSManifestResult(result, {
    ...options,
    ...(fromFile
      ? {
        from: fromFile,
        referenceStack: [...((options as CompileCSSManifestInternalOptions).referenceStack || []), fromFile]
      }
      : {})
  })
}

function compileCSSManifestFileInternal(file: string, options: CompileCSSManifestInternalOptions = {}): CompileCSSManifestResult {
  const absoluteFile = isAbsolute(file) ? file : resolve(options.root || '', file)
  const result = compileCSSFile(file, {
    ...options,
    preserveNativeCSS: options.preserveNativeCSS ?? false
  })
  return toCompileCSSManifestResult(result, {
    ...options,
    from: absoluteFile,
    referenceStack: [...(options.referenceStack || []), absoluteFile]
  })
}

export function compileCSSManifestFile(file: string, options: CompileCSSManifestOptions = {}): CompileCSSManifestResult {
  return compileCSSManifestFileInternal(file, options)
}

export function compileProjectManifest(entries: string[], options: CompileCSSManifestOptions = {}): CompileProjectManifestResult {
  const dependencies: string[] = []
  let extractionPolicy = createCSSDirectiveExtractionPolicy()
  const classNames: string[] = []
  const nativeClassNames: string[] = []
  const nativeCSS: string[] = []
  const css: string[] = []
  const generatedCSS: string[] = []
  const warnings: string[] = []
  let directives: CompileCSSResult = {
    manifestInput: {},
    extractionPolicy: createCSSDirectiveExtractionPolicy(),
    classNames: [],
    nativeClassNames: [],
    nativeCSS: '',
    css: '',
    generatedCSS: '',
    warnings: [],
    dependencies: []
  }
  let manifest: MasterCSSManifest | undefined = options.baseManifest
  for (const entry of entries) {
    const result = compileCSSFile(entry, {
      ...options,
      preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    directives = result
    extractionPolicy = mergeCSSDirectiveExtractionPolicy(extractionPolicy, result.extractionPolicy)
    addUnique(dependencies, result.dependencies)
    addUnique(classNames, result.classNames)
    addUnique(nativeClassNames, result.nativeClassNames)
    addUnique(warnings, result.warnings)
    const manifestResult = toCompileCSSManifestResult(result, {
      ...options,
      baseManifest: manifest,
      from: entry,
      referenceStack: [isAbsolute(entry) ? entry : resolve(options.root || '', entry)]
    })
    manifest = manifestResult.manifest
    addUnique(dependencies, manifestResult.dependencies)
    addUnique(warnings, manifestResult.warnings)
    const entryGeneratedCSS = manifestResult.generatedCSS || ''
    if (result.nativeCSS) nativeCSS.push(result.nativeCSS)
    if (entryGeneratedCSS) generatedCSS.push(entryGeneratedCSS)
    if (manifestResult.css) css.push(manifestResult.css)
  }
  const resolvedManifest = manifest || compileManifestInputWithRust({}, undefined)
  return {
    entries,
    manifest: resolvedManifest,
    resolutionManifest: resolvedManifest,
    dependencies,
    extractionPolicy,
    classNames,
    nativeClassNames,
    nativeCSS: nativeCSS.join('\n'),
    css: css.join('\n'),
    generatedCSS: generatedCSS.join('\n'),
    warnings,
    directives
  }
}

function toManifestJSONResult<T extends { manifest: MasterCSSManifest }>(result: T): T & { json: string } {
  return {
    ...result,
    json: stringifyMasterCSSManifestJSON(result.manifest)
  }
}

export function compileCSSManifestJSON(file: string, options: CompileCSSManifestOptions = {}): CompileCSSManifestJSONResult {
  return toManifestJSONResult(compileCSSManifestFile(file, options))
}

export function compileProjectManifestJSON(entries: string[], options: CompileCSSManifestOptions = {}) {
  return toManifestJSONResult(compileProjectManifest(entries, options))
}
