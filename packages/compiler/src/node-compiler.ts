import { noticeDiagnostics } from './notices'
/** @internal Node-only compiler and import-graph implementation. */
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { extname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pureCSSCache } from './pure-css-cache'
import { deepFreeze } from './deep-freeze'
import { fileStampsCurrent, settledFileStamps, type FileStamp } from './file-stamps'
import { createCompilerBindingSessionSync, manifestOf, MasterCSSManifestReference, type MasterCSSManifestSource } from '@master/css-binding/compiler/node'
import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  CSSDirectiveExtractionPolicy,
  CSSDirectiveReference,
  CSSDefinitionSource
} from '@master/css-schema/css-directives'
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
  resolveNodePackageCSS,
  resolveMasterCSSPackageEntryFile,
  prepareCSSImportGraph,
  stylesheetResourceOwner,
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
  usesCustomMedia?: boolean
}

export interface InspectCSSResult {
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

type CompileCSSManifestInternalOptions = Omit<CompileCSSManifestSourceOptions, 'baseManifest'> & {
  /** Internal compilations pass the binding's references along unread. */
  baseManifest?: MasterCSSManifestSource
  /** Host context definitions retain file URL owners until the host publishes assets. */
  resolveReferenceResources?: boolean
  definitionsOnly?: boolean
  referenceResources?: boolean
  referenceStack?: string[]
  sourceText?: string
  onDependency?: (file: string) => void
}

export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
  sourceTexts?: Record<string, string>
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  directives: CompileCSSResult
  /** @internal The binding's references, read into `manifest` and `resolutionManifest` on demand. */
  readonly manifestReference?: MasterCSSManifestReference
  /** @internal */
  readonly resolutionManifestReference?: MasterCSSManifestReference
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

/**
 * Whether a stylesheet needs a local Master CSS transform: a native style rule
 * applies a mixin, it references definitions, or it uses custom media. Rust
 * parses only stylesheets that contain `@apply`.
 */
export function hasLocalStyleDirectives(source: string, from?: string): boolean {
  return callCompilerBinding<boolean>(() => nativeCompiler().hasLocalStyleDirectives(source, from || 'master.css'))
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
  return pureCSSCache.run('dependencies', source, () => callCompilerBinding<CSSDependencyAnalysis>(() => nativeCompiler().analyzeCSSDependencies(source)))
}

interface MasterCSSPackageGraph {
  entry: string
  stamps: readonly (readonly [string, number, number])[]
  graph: ResolvedCSSImportGraph
  comparableFiles: ReadonlySet<string>
}

const masterCSSPackageGraphs = new Map<string, MasterCSSPackageGraph>()

function fileStamp(file: string) {
  const stats = statSync(file, { throwIfNoEntry: false })
  return stats ? [stats.mtimeMs, stats.size] as const : [-1, -1] as const
}

/**
 * Hosts ask for the installed `@master/css` graph for every stylesheet. Reuse it
 * while its entry and every file it read are unchanged.
 */
function masterCSSPackageGraph(projectDir?: string): MasterCSSPackageGraph {
  const entry = resolveMasterCSSPackageEntryFile(MASTER_CSS_PACKAGE_ID, projectDir || process.cwd(), projectDir)
  if (!entry) {
    throw new Error(`Cannot resolve ${MASTER_CSS_PACKAGE_ID} CSS entry.`)
  }
  const key = projectDir ?? ''
  const cached = masterCSSPackageGraphs.get(key)
  if (cached?.entry === entry && cached.stamps.every(([file, mtimeMs, size]) => {
    const [currentMtimeMs, currentSize] = fileStamp(file)
    return currentMtimeMs === mtimeMs && currentSize === size
  })) return cached
  const files = new Set<string>([entry])
  const graph = resolveCSSImportGraph(entry, { projectDir, onDependency: file => files.add(file) })
  for (const dependency of graph.dependencies) files.add(dependency)
  const resolved: MasterCSSPackageGraph = {
    entry,
    stamps: [...files].map(file => [file, ...fileStamp(file)] as const),
    graph: Object.freeze({ ...graph, dependencies: Object.freeze([...graph.dependencies]) }) as ResolvedCSSImportGraph,
    comparableFiles: new Set(graph.dependencies.map(resolveComparablePath))
  }
  masterCSSPackageGraphs.set(key, resolved)
  return resolved
}

export function resolveMasterCSSPackageImportGraph(projectDir?: string) {
  return masterCSSPackageGraph(projectDir).graph
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
    return masterCSSPackageGraph(projectDir).comparableFiles.has(filename)
  } catch {
    return false
  }
}

const REFERENCE_CACHE_CAPACITY = 512
const referenceCache = new Map<string, readonly CSSDirectiveReference[]>()

/**
 * The `@reference` statements that {@link compileCSS} reports for `source`. Hosts
 * read them for every stylesheet in a reference graph, per compiled stylesheet;
 * they depend only on the source and its identity, so a repeated source skips
 * compiling and copying the whole directive result.
 */
export function compileCSSReferences(source: string, from: string): readonly CSSDirectiveReference[] {
  const key = createHash('sha256').update(from).update('\0').update(source).digest('hex')
  const cached = referenceCache.get(key)
  if (cached) {
    referenceCache.delete(key)
    referenceCache.set(key, cached)
    return cached
  }
  const references = Object.freeze((compileCSS(source, { from, preserveNativeCSS: false }).references ?? [])
    .map(reference => Object.freeze(reference)))
  if (referenceCache.size >= REFERENCE_CACHE_CAPACITY) referenceCache.delete(referenceCache.keys().next().value!)
  referenceCache.set(key, references)
  return references
}

export function compileCSS(source: string, options: CompileCSSOptions = {}): CompileCSSResult {
  const from = options.from || 'master.css'
  const bindingOptions = {
    from,
    resourceOwner: stylesheetResourceOwner(from),
    preserveNativeCSS: options.preserveNativeCSS !== false,
    pruneNativeCSS: options.pruneNativeCSS === true,
    ...(options.preserveNativeSource === undefined ? {} : { preserveNativeSource: options.preserveNativeSource }),
    ...(options.classes ? { classes: options.classes } : {})
  }
  const result = reviveBindingCompileResult(pureCSSCache.run('directives', [source, bindingOptions], () => callCompilerBinding<CompileCSSResult>(() => (
    nativeCompiler().compileCSSDirectives(
      source,
      bindingOptions
    )
  ))))
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

export function collectStandaloneCSSDirectiveExtractionPolicy(source: string) {
  return analyzeStandaloneDirectives(source).extractionPolicy
}

export function removeStandaloneCSSDirectives(source: string) {
  return analyzeStandaloneDirectives(source).code
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
  notices?: CompileCSSResult['notices']
  definitionSources: CSSDefinitionSource[]
  css?: string
  outputMappings?: import('@master/css-schema/css-directives').CSSOutputMapping[]
  generatedMappings?: CompileCSSResult['generatedMappings']
  input: CompileCSSResult['manifestInput']
  manifest: MasterCSSManifest
  resolutionManifest: MasterCSSManifest
  warnings: string[]
  generatedCSS: string
}

function lowerCSSDirectivesWithBinding(
  result: CompileCSSResult,
  options: {
    baseManifest?: MasterCSSManifest
    resolutionManifest?: MasterCSSManifest
    onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
    sourceText?: string
  }
) {
  const lowered = callCompilerBinding<BindingLowerCSSDirectivesResult>(() => (
    nativeCompiler().lowerCSSDirectives(
      {
        manifestInput: result.manifestInput,
        definitionSources: result.definitionSources || [],
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
  for (const warning of lowered.warnings) {
    options.onDiagnostic?.(compilerWarningDiagnostic(warning))
  }
  noticeDiagnostics(lowered.notices, options.onDiagnostic)
  return lowered
}

function addUnique<T>(target: T[], values: Iterable<T> | undefined) {
  if (!values) return
  for (const value of values) {
    if (!target.includes(value)) target.push(value)
  }
}

export function resolveCSSReferenceFile(reference: CSSDirectiveReference & { resolvedFile?: string }, options: Pick<CompileCSSManifestSourceOptions, 'root'> = {}) {
  if (reference.resolvedFile) return reference.resolvedFile
  const fromFile = reference.file
    ? isAbsolute(reference.file)
      ? reference.file
      : resolve(options.root || '', reference.file)
    : resolve(options.root || process.cwd(), 'master.css')
  const packageFile = resolveMasterCSSPackageEntryFile(reference.source, fromFile, options.root)
  if (packageFile) return packageFile
  const exportedCSS = resolveNodePackageCSS(reference.source, fromFile)
  if (exportedCSS) return exportedCSS
  if (isExpandableImportSource(reference.source, fromFile)) return resolveRelativeCSSFile(reference.source, fromFile)
  throw new Error(`@reference only supports relative CSS files or exported package CSS entries: ${reference.source}`)
}

function normalizeReferenceStack(stack: string[] | undefined) {
  return (stack || []).map((file) => resolveComparablePath(file))
}

type ReferenceDefinitions = Pick<CompileCSSManifestResult, 'definitionSources' | 'dependencies' | 'warnings'> & {
  readonly manifest: MasterCSSManifestSource
}

interface CachedReferenceDefinitions {
  readonly stamps: readonly FileStamp[]
  /** Comparable paths of every file the compilation read. */
  readonly files: ReadonlySet<string>
  /** What the compilation reported, replayed to later hosts in order. */
  readonly observed: readonly string[]
  readonly diagnostics: readonly MasterCSSDiagnostic[]
  readonly result: ReferenceDefinitions
}

const REFERENCE_DEFINITIONS_CAPACITY = 32
const withoutBaseManifest = {}
const referenceDefinitions = new WeakMap<object, Map<string, CachedReferenceDefinitions>>()

/**
 * The definitions a stylesheet reads from one `@reference`. Hosts transform
 * every local stylesheet against the same project references, so a compilation
 * is reused while every file it read is unchanged.
 */
function compileReferenceDefinitions(
  referenceFile: string,
  baseManifest: MasterCSSManifestSource | undefined,
  options: CompileCSSManifestInternalOptions
): ReferenceDefinitions {
  const key = JSON.stringify([
    referenceFile, options.root ?? '', options.resolveReferenceResources === true, options.pruneNativeCSS === true,
    options.preserveNativeSource ?? null, options.classes ?? null, Boolean(options.onDiagnostic)
  ])
  const cache = referenceDefinitions.get(baseManifest ?? withoutBaseManifest)
  const cached = cache?.get(key)
  const stack = normalizeReferenceStack(options.referenceStack)
  // A referencing stylesheet the definitions read is a cycle: compile to report it.
  if (cached && !stack.some(file => cached.files.has(file)) && fileStampsCurrent(cached.stamps)) {
    cache!.delete(key)
    cache!.set(key, cached)
    for (const file of cached.observed) options.onDependency?.(file)
    for (const diagnostic of cached.diagnostics) options.onDiagnostic?.(diagnostic)
    return cached.result
  }
  const startedAt = Date.now()
  const observed: string[] = []
  const diagnostics: MasterCSSDiagnostic[] = []
  const { mapReferences: _mapReferences, ...inherited } = options as CompileCSSManifestInternalOptions & { mapReferences?: unknown }
  const compiled = compileCSSManifestFileInternal(referenceFile, {
    ...inherited,
    baseManifest,
    preserveNativeCSS: false,
    definitionsOnly: true,
    referenceResources: options.resolveReferenceResources,
    referenceStack: options.referenceStack,
    onDependency: file => { observed.push(file); options.onDependency?.(file) },
    ...(options.onDiagnostic ? { onDiagnostic: (diagnostic: MasterCSSDiagnostic) => { diagnostics.push(diagnostic); options.onDiagnostic!(diagnostic) } } : {})
  })
  const result: ReferenceDefinitions = {
    definitionSources: compiled.definitionSources,
    manifest: compiled.manifestReference ?? compiled.manifest,
    dependencies: compiled.dependencies,
    warnings: compiled.warnings
  }
  const read = [referenceFile, ...observed, ...compiled.dependencies]
  const stamps = settledFileStamps(read, startedAt)
  if (stamps) {
    let entries = cache
    if (!entries) referenceDefinitions.set(baseManifest ?? withoutBaseManifest, entries = new Map())
    entries.delete(key)
    if (entries.size >= REFERENCE_DEFINITIONS_CAPACITY) entries.delete(entries.keys().next().value!)
    entries.set(key, { stamps, files: new Set(read.map(resolveComparablePath)), observed, diagnostics, result: Object.freeze({ ...result, definitionSources: deepFreeze(result.definitionSources) }) })
  }
  return result
}

function resolveCSSReferenceContext(
  references: CSSDirectiveReference[] | undefined,
  options: CompileCSSManifestInternalOptions = {}
) {
  const dependencies: string[] = []
  const warnings: string[] = []
  let manifest = options.baseManifest
  let hasReferences = false
  const definitionSources: CSSDefinitionSource[] = []

  for (const reference of references || []) {
    const referenceFile = resolveCSSReferenceFile(reference, options)
    options.onDependency?.(referenceFile)
    const comparableReferenceFile = resolveComparablePath(referenceFile)
    const stack = normalizeReferenceStack(options.referenceStack)
    if (stack.includes(comparableReferenceFile)) {
      throw new Error(`Circular CSS reference: ${[...(options.referenceStack || []), referenceFile].join(' -> ')}`)
    }
    const result = compileReferenceDefinitions(referenceFile, manifest, options)
    definitionSources.push(...(result.definitionSources || []))
    hasReferences = true
    manifest = result.manifest
    addUnique(dependencies, result.dependencies)
    addUnique(warnings, result.warnings)
  }

  return {
    dependencies,
    warnings,
    definitionSources,
    ...(hasReferences ? { manifest } : {})
  }
}

function toCompileCSSManifestResult(
  result: CompileCSSResult,
  options: CompileCSSManifestInternalOptions = {}
): CompileCSSManifestResult {
  const { manifestInput: _directiveManifestInput, ...directiveData } = result
  const referenceContext = resolveCSSReferenceContext(result.references, options)
  const definitionSources = [...referenceContext.definitionSources, ...(result.definitionSources || [])]
  const lowerResult = lowerCSSDirectivesWithBinding({ ...result, definitionSources }, {
    baseManifest: options.baseManifest && manifestOf(options.baseManifest),
    resolutionManifest: referenceContext.manifest && manifestOf(referenceContext.manifest),
    onDiagnostic: options.onDiagnostic,
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
    definitionSources: lowerResult.definitionSources,
    notices: lowerResult.notices,
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
    const parsed = compileCSS(source, { from: file, preserveNativeCSS: false })
    const references = parsed.references || []
    return options.mapReferences?.(file, source, references) ?? references
  })
  const referenceContext = resolveCSSReferenceContext(references, options)
  const resourceDependencies: string[] = []
  const resourceURLs = options.referenceResources ? Object.fromEntries(Object.entries(graph.files).map(([file, source]) => [file,
    Object.fromEntries(analyzeCSSDependencies(source).resources.flatMap(({ url }) => {
      if (url.startsWith('/') || url.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(url)) return []
      const resource = new URL(url, pathToFileURL(file))
      const owner = fileURLToPath(resource)
      resourceDependencies.push(owner)
      options.onDependency?.(owner)
      return [[url, resource.href]]
    }))
  ])) : undefined
  // Manifests stay in the binding: the project manifest is not shipped for every stylesheet.
  const compiled = callCompilerBinding<ReturnType<ReturnType<typeof nativeCompiler>['compileCSSStylesheetGraphWithReferences']>>(() => nativeCompiler().compileCSSStylesheetGraphWithReferences({
    graph,
    ...(options.definitionsOnly ? { nativeStylesheets: [] } : {}),
    urls: Object.fromEntries(Object.keys(graph.files).map(file => [file, pathToFileURL(file).href])),
    baseManifest: options.baseManifest,
    resolutionManifest: referenceContext.manifest,
    definitionSources: referenceContext.definitionSources,
    resourceURLs,
    options: { from: graph.entry, preserveNativeCSS: options.preserveNativeCSS !== false,
        pruneNativeCSS: options.pruneNativeCSS === true,
        ...(options.preserveNativeSource === undefined ? {} : { preserveNativeSource: options.preserveNativeSource }), ...(options.classes ? { classes: options.classes } : {}) },
    inlineImports: true
  }))
  const directives = reviveBindingCompileResult(compiled.directives as CompileCSSResult)
  directives.references = references.length ? references : undefined
  const dependencies = [...new Set([...directives.dependencies, ...referenceContext.dependencies, ...resourceDependencies])]
  const warnings = [...new Set([...directives.warnings, ...referenceContext.warnings])]
  for (const warning of warnings) options.onDiagnostic?.(compilerWarningDiagnostic(warning))
  noticeDiagnostics(directives.notices, options.onDiagnostic)
  const entry = compiled.stylesheets.find(sheet => sheet.id === compiled.entry)!
  const result = {
    ...directives, dependencies, warnings, css: entry.css, outputMappings: entry.outputMappings, sourceTexts: graph.files,
    directives, stylesheets: compiled.stylesheets
  }
  // Most hosts only execute the manifests, through their references; read them on demand.
  return Object.defineProperties(result, {
    manifest: { enumerable: true, configurable: true, get: () => compiled.manifest.manifest() },
    resolutionManifest: { enumerable: true, configurable: true, get: () => compiled.resolutionManifest.manifest() },
    manifestReference: { value: compiled.manifest },
    resolutionManifestReference: { value: compiled.resolutionManifest }
  }) as typeof result & Pick<CompileCSSManifestResult, 'manifest' | 'resolutionManifest' | 'manifestReference' | 'resolutionManifestReference'>
}

export function createManifestFromCSSResult(
  result: CompileCSSResult,
  options: CompileCSSManifestSourceOptions & { sourceText?: string, onDependency?: (file: string) => void, resolveReferenceResources?: boolean } = {}
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
    projectDir: options.root, onDependency: options.onDependency, resolveNodePackageImports: true
  }, analyzeCSSDependencies)
  return compileCSSManifestGraph(graph, {
    ...options, preserveNativeCSS: options.preserveNativeCSS ?? true,
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
      preserveNativeCSS: options.preserveNativeCSS ?? true
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
