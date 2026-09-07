/** @internal Node-only compiler and import-graph implementation. */
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, isAbsolute, resolve } from 'node:path'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  CSSDirectiveExtractionPolicy,
  CSSDirectiveReference
} from '@master/css-schema/css-directives'
import {
  setCompilerDiagnosticCount,
  type CompilerDiagnosticRecorder
} from './compiler-diagnostics'
import {
  type CompileCSSOptions,
  type CSSReferenceStatement,
  type CompileCSSFileOptions,
  type CompileCSSResult,
  type ResolvedCSSImportGraph,
  emptyExtractionPolicy
} from './contracts'

export type {
  CompileCSSFileOptions,
  CompileCSSOptions,
  CompileCSSResult,
  CSSReferenceStatement,
  ResolvedCSSImportGraph
} from './contracts'

const require = createRequire(import.meta.url)
const MASTER_CSS_PACKAGE_ID = '@master/css'
const MASTER_CSS_PACKAGE_IDS = new Set([MASTER_CSS_PACKAGE_ID, '@master/css-preset'])

interface CSSPackageJSON {
  name?: unknown
  style?: unknown
  exports?: unknown
}

export interface CSSDependencyImport {
  start: number
  end: number
  statement: string
  source: string
}

export interface CSSDependencyAnalysis {
  sourceWithoutReferences: string
  imports: CSSDependencyImport[]
}

export interface InspectCSSResult {
  hasMasterEntryDirective: boolean
  hasMasterCSSImport: boolean
  hasMasterEntry: boolean
  directives: {
    name: string
    range: { start: number, end: number }
    preludeRange: { start: number, end: number }
    hasBlock: boolean
    quotedStrings: number
  }[]
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
  sourceText?: string
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  directives: CompileCSSResult
}

export interface CompileProjectManifestResult extends CompileCSSManifestResult {
  entries: string[]
}

function throwCompilerBindingError(error: unknown): never {
  if (error instanceof MasterCSSError) throw error
  throw new MasterCSSError({
    code: 'CSS_COMPILER_ERROR',
    domain: 'compiler',
    message: error instanceof Error ? error.message : String(error)
  }, {
    cause: error
  })
}

function callCompilerBinding<T>(call: () => unknown): T {
  try {
    return call() as T
  } catch (error) {
    throwCompilerBindingError(error)
  }
}

function nativeCompiler() {
  return createCompilerBindingSessionSync()
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
  return callCompilerBinding<InspectCSSResult>(() => nativeCompiler().inspectCSS(source))
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
  options: ResolveCSSImportGraphOptions = {},
  sourceOverride?: string
): void {
  const absoluteFile = resolve(file)
  if (sourceOverride === undefined && !existsSync(absoluteFile)) {
    throw new Error(`CSS file not found: ${absoluteFile}`)
  }
  if (visited.has(absoluteFile)) return
  visited.add(absoluteFile)

  const source = sourceOverride ?? readFileSync(absoluteFile, 'utf-8')
  graph.files[absoluteFile] = source
  const analysis = callCompilerBinding<{
    sourceWithoutReferences: string
    imports: { source: string }[]
  }>(() => nativeCompiler().analyzeCSSDependencies(source))
  for (const importStatement of analysis.imports) {
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
  return resolveCSSImportGraphSource(file, undefined, options)
}

export function resolveCSSImportGraphSource(
  file: string,
  source: string | undefined,
  options: ResolveCSSImportGraphOptions = {}
): ResolvedCSSImportGraph {
  const entry = resolve(file)
  const graph: PreparedCSSImportGraph = {
    entry,
    files: {},
    edges: []
  }
  prepareCSSImportGraphFile(entry, graph, new Set(), options, source)
  const result = callCompilerBinding<ResolvedCSSImportGraph>(() => (
    nativeCompiler().resolveCSSImportGraph(graph)
  ))
  for (const reference of result.references || []) {
    options.onReference?.(reference as CSSReferenceStatement, reference.file || entry)
  }
  return result
}

export function analyzeCSSDependencies(source: string): CSSDependencyAnalysis {
  return callCompilerBinding<CSSDependencyAnalysis>(() => nativeCompiler().analyzeCSSDependencies(source))
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

export function stripRequestSuffix(id: string) {
  const searchStart = id.startsWith('//?/') || id.startsWith('\\\\?\\') ? 4 : 0
  const suffixIndex = id.slice(searchStart).search(/[?#]/)
  return suffixIndex === -1 ? id : id.slice(0, searchStart + suffixIndex)
}

export function stripWindowsExtendedPathPrefix(file: string) {
  const match = /^[/\\]{2}\?[/\\](?:(UNC)[/\\])?/i.exec(file)
  if (!match) return file
  const path = file.slice(match[0].length)
  return match[1] ? `\\\\${path}` : path
}

function stripRequest(id: string) {
  return stripRequestSuffix(id)
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
  const result = reviveBindingCompileResult(callCompilerBinding<CompileCSSResult>(() => (
    nativeCompiler().compileCSSDirectives(
      source,
      {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      }
    )
  )))
  for (const warning of result.warnings) {
    options.onDiagnostic?.(compilerWarningDiagnostic(warning))
  }
  return result
}

function reviveBindingCompileResult(result: CompileCSSResult): CompileCSSResult {
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

function compilerWarningDiagnostic(message: string): MasterCSSDiagnostic {
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'COMPILER_WARNING',
    domain: 'compiler',
    severity: 'warning',
    message
  })
}

function toWireExtractionPolicy(
  policy: Partial<CSSDirectiveExtractionPolicy> | undefined
) {
  return {
    ...emptyExtractionPolicy(),
    ...policy,
    include: [...(policy?.include || [])],
    exclude: [...(policy?.exclude || [])],
    safelist: [...(policy?.safelist || [])],
    blocklist: toWireBlocklist(policy?.blocklist)
  }
}

function toWireBlocklist(blocklist: Iterable<string | RegExp> | undefined) {
  return [...(blocklist || [])].map((entry) => entry instanceof RegExp
    ? { source: entry.source, flags: entry.flags }
    : entry)
}

export function filterCSSExtractionCandidates(
  candidates: string[],
  blocklist: Iterable<string | RegExp> = []
) {
  return [...nativeCompiler().filterCSSExtractionCandidates(candidates, toWireBlocklist(blocklist))]
}

function reviveExtractionPolicy(policy: CSSDirectiveExtractionPolicy): CSSDirectiveExtractionPolicy {
  policy.blocklist = policy.blocklist.map((entry) => {
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
  return policy
}

export function mergeCSSDirectiveExtractionPolicy(
  ...policies: (Partial<CSSDirectiveExtractionPolicy> | undefined)[]
) {
  return reviveExtractionPolicy(callCompilerBinding<CSSDirectiveExtractionPolicy>(() => (
    nativeCompiler().mergeCSSExtractionPolicies(policies.map(toWireExtractionPolicy))
  )))
}

export function createCSSDirectiveExtractionPolicy() {
  return mergeCSSDirectiveExtractionPolicy()
}

export interface StandaloneCSSDirectiveStatement {
  start: number
  end: number
  atRuleName: 'master' | 'source' | 'safelist' | 'blocklist' | 'preserve'
  name: string
  statement: string
  args: string[]
  modifiers: string[]
}

export type StandaloneMasterDirectiveStatement = StandaloneCSSDirectiveStatement & {
  atRuleName: 'master'
}

interface StandaloneDirectiveAnalysis {
  code: string
  statements: StandaloneCSSDirectiveStatement[]
  extractionPolicy: CSSDirectiveExtractionPolicy
}

function analyzeStandaloneDirectives(source: string) {
  const result = callCompilerBinding<StandaloneDirectiveAnalysis>(() => (
    nativeCompiler().analyzeStandaloneDirectives(source)
  ))
  result.extractionPolicy = reviveExtractionPolicy(result.extractionPolicy)
  return result
}

export function findStandaloneCSSDirectiveStatements(source: string) {
  return analyzeStandaloneDirectives(source).statements
}

export function findStandaloneMasterDirectiveStatements(source: string) {
  return findStandaloneCSSDirectiveStatements(source)
    .filter((statement): statement is StandaloneMasterDirectiveStatement => statement.atRuleName === 'master')
}

export function collectStandaloneCSSDirectiveExtractionPolicy(source: string) {
  return analyzeStandaloneDirectives(source).extractionPolicy
}

export function removeStandaloneCSSDirectives(source: string) {
  return analyzeStandaloneDirectives(source).code
}

export function removeStandaloneMasterDirectives(source: string) {
  const statements = findStandaloneMasterDirectiveStatements(source)
  let output = source
  for (const statement of statements.toReversed()) {
    output = output.slice(0, statement.start) + output.slice(statement.end)
  }
  return output
}

function compileManifestInputWithBinding(
  input: CompileCSSResult['manifestInput'],
  baseManifest: MasterCSSManifest | undefined
) {
  return callCompilerBinding<{ manifest: MasterCSSManifest }>(() => (
    nativeCompiler().compileManifestInput(
      input,
      baseManifest ? { baseManifest } : undefined
    )
  )).manifest
}

interface BindingLowerCSSDirectivesResult {
  input: CompileCSSResult['manifestInput']
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  warnings: string[]
  generatedCSS: string
  diagnosticCounts: Record<string, number>
}

function lowerCSSDirectivesWithBinding(
  result: CompileCSSResult,
  options: {
    baseManifest?: MasterCSSManifest
    resolutionManifest?: MasterCSSManifest
    onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
    diagnostics?: CompilerDiagnosticRecorder
    sourceText?: string
  }
) {
  const lowered = callCompilerBinding<BindingLowerCSSDirectivesResult>(() => (
    nativeCompiler().lowerCSSDirectives(
      {
        manifestInput: result.manifestInput,
        styleDefinitions: result.styleDefinitions || [],
        warnings: result.warnings
      },
      {
        ...(options.baseManifest ? { baseManifest: options.baseManifest } : {}),
        ...(options.resolutionManifest ? { resolutionManifest: options.resolutionManifest } : {})
      },
      options.sourceText
    )
  ))
  for (const [metricId, value] of Object.entries(lowered.diagnosticCounts)) {
    setCompilerDiagnosticCount(options.diagnostics, metricId, value)
  }
  for (const warning of lowered.warnings) {
    options.onDiagnostic?.(compilerWarningDiagnostic(warning))
  }
  return lowered
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
  const lowerResult = lowerCSSDirectivesWithBinding(result, {
    baseManifest: options.baseManifest,
    resolutionManifest: referenceContext.manifest,
    onDiagnostic: options.onDiagnostic,
    diagnostics: options.diagnostics,
    sourceText: options.sourceText
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
    manifest: lowerResult.manifest,
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
    sourceText: source,
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
    sourceText: readFileSync(stripRequest(absoluteFile), 'utf8'),
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
      sourceText: readFileSync(
        stripRequest(isAbsolute(entry) ? entry : resolve(options.root || '', entry)),
        'utf8'
      ),
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
  const resolvedManifest = manifest || compileManifestInputWithBinding({}, undefined)
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
