/** @internal Node-only compiler and import-graph implementation. */
import { readFileSync, realpathSync } from 'node:fs'
import { extname, isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
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

import {
  isExpandableImportSource,
  resolveRelativeCSSFile,
  resolveMasterCSSPackageEntryFile,
  prepareCSSImportGraph,
  type PreparedCSSImportGraph
} from './node-imports'
export { resolveMasterCSSPackageEntryFile } from './node-imports'

const MASTER_CSS_PACKAGE_ID = '@master/css'

export type {
  CompileCSSFileOptions,
  CompileCSSOptions,
  CompileCSSResult,
  CSSReferenceStatement,
  ResolvedCSSImportGraph
} from './contracts'

export interface CSSDependencyImport {
  start: number
  end: number
  statement: string
  source: string
}

export interface CSSDependencyAnalysis {
  sourceWithoutReferences: string
  imports: CSSDependencyImport[]
  resources: { start: number, end: number, url: string }[]
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
  onDependency?: (file: string) => void
  onSource?: (file: string, source: string) => void
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
  onDependency?: (file: string) => void
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

export function inspectCSS(source: string): InspectCSSResult {
  return callCompilerBinding<InspectCSSResult>(() => nativeCompiler().inspectCSS(source))
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
  const graph = prepareCSSImportGraph(file, source, options, analyzeCSSDependencies)
  for (const [inputFile, inputSource] of Object.entries(graph.files)) options.onSource?.(inputFile, inputSource)
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
  css?: string
  outputMappings?: import('@master/css-schema/css-directives').CSSOutputMapping[]
  generatedMappings?: CompileCSSResult['generatedMappings']
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
        nativeOutput: result.nativeOutput,
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

export function resolveCSSReferenceFile(reference: CSSDirectiveReference, options: CompileCSSManifestSourceOptions = {}) {
  const fromFile = reference.file
    ? isAbsolute(reference.file)
      ? reference.file
      : resolve(options.root || '', reference.file)
    : resolve(options.root || process.cwd(), 'master.css')
  const packageFile = resolveMasterCSSPackageEntryFile(reference.source, fromFile, options.root)
  if (packageFile) return packageFile
  if (isExpandableImportSource(reference.source, fromFile)) return resolveRelativeCSSFile(reference.source, fromFile)
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
    options.onDependency?.(referenceFile)
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
  const css = lowerResult.css ?? [
    result.nativeCSS,
    generatedCSS
  ].filter(Boolean).join('\n')
  return {
    ...directiveData,
    ...(lowerResult.css === undefined ? {} : { outputMappings: lowerResult.outputMappings ?? [] }),
    dependencies,
    manifest: lowerResult.manifest,
    resolutionManifest: lowerResult.resolutionManifest,
    warnings,
    generatedCSS,
    generatedMappings: lowerResult.generatedMappings,
    css,
    directives: result
  }
}

/** Compile original files independently before merging their manifest and native output. */
export function compileCSSManifestGraph(
  graph: PreparedCSSImportGraph,
  options: CompileCSSManifestInternalOptions & {
    mapReferences?: (file: string, source: string, references: CSSDirectiveReference[]) => readonly CSSDirectiveReference[]
  } = {}
) {
  const references = Object.entries(graph.files).flatMap(([file, source]) => {
    const parsed = compileCSS(source, { from: file })
    const references = parsed.references || []
    return options.mapReferences?.(file, source, references) ?? references
  })
  const referenceContext = resolveCSSReferenceContext(references, options)
  const compiled = callCompilerBinding<ReturnType<ReturnType<typeof nativeCompiler>['compileCSSStylesheetGraph']>>(() => nativeCompiler().compileCSSStylesheetGraph({
    graph,
    urls: Object.fromEntries(Object.keys(graph.files).map(file => [file, pathToFileURL(file).href])),
    baseManifest: options.baseManifest,
    resolutionManifest: referenceContext.manifest,
    options: { from: graph.entry, preserveNativeCSS: options.preserveNativeCSS !== false, ...(options.classes ? { classes: options.classes } : {}) },
    inlineImports: true
  }))
  const directives = reviveBindingCompileResult(compiled.directives as CompileCSSResult)
  directives.references = references.length ? references : undefined
  const dependencies = [...new Set([...directives.dependencies, ...referenceContext.dependencies])]
  const warnings = [...new Set([...directives.warnings, ...referenceContext.warnings])]
  for (const warning of warnings) options.onDiagnostic?.(compilerWarningDiagnostic(warning))
  const entry = compiled.stylesheets.find(sheet => sheet.id === compiled.entry)!
  return {
    ...directives, dependencies, warnings, css: entry.css, outputMappings: entry.outputMappings,
    manifest: compiled.manifest, resolutionManifest: compiled.resolutionManifest,
    directives, stylesheets: compiled.stylesheets
  }
}

export function createManifestFromCSSResult(
  result: CompileCSSResult,
  options: CompileCSSManifestSourceOptions & { sourceText?: string, onDependency?: (file: string) => void } = {}
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
  const graph = prepareCSSImportGraph(absoluteFile, undefined, {
    projectDir: options.root, onDependency: options.onDependency
  }, analyzeCSSDependencies)
  return compileCSSManifestGraph(graph, {
    ...options, preserveNativeCSS: options.preserveNativeCSS ?? false,
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
    const manifestResult = compileCSSManifestFile(entry, {
      ...options,
      baseManifest: manifest,
      preserveNativeCSS: options.preserveNativeCSS ?? false
    })
    const result = manifestResult.directives
    directives = result
    extractionPolicy = mergeCSSDirectiveExtractionPolicy(extractionPolicy, result.extractionPolicy)
    addUnique(dependencies, result.dependencies)
    addUnique(classNames, result.classNames)
    addUnique(nativeClassNames, result.nativeClassNames)
    addUnique(warnings, result.warnings)
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
