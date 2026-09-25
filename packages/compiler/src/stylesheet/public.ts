import { stylesheetValidationSource } from './output-map'
import { validateCompiledCSS, assertValidationOptions } from '../value-validation'
import { mapStylesheetError, type StylesheetSourceContext } from './source-context'
import type { StylesheetDeliveryOptions, StylesheetResourceAsset } from './delivery'
import { prepareCSSImportGraph, prepareCSSImportGraphWithResolver, normalizeStylesheetGraphID, type CSSImportFileResolver } from '../node-imports'
export type { CSSImportFileResolver as MasterCSSStylesheetImportResolver, CSSImportSource as MasterCSSStylesheetImportSource } from '../node-imports'
import { analyzeCSSDependencies, inspectCSS } from '../node-compiler'
export type { StylesheetDeliveryOptions as MasterCSSStylesheetDeliveryOptions, StylesheetResourceAsset as MasterCSSStylesheetResourceAsset } from './delivery'
import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import type {
  MasterCSSCompileOptions,
  MasterCSSCompileResult
} from '../index'
import { toMasterCSSCompileResultInternal } from '../compiler'
import {
  cleanStyleRequest,
  collectStylesheetDependencies as collectStylesheetDependenciesInternal,
  compileRenderedStylesheet as compileRenderedStylesheetInternal,
  compileStylesheet as compileStylesheetInternal,
  createExtractedCSSResult,
  createStyleEntryEmittedGlobals,
  createStylesheetHostSource,
  hasLocalStyleDirectives,
  isMasterCSSPackageStyleFile,
  isStylesheetRequest,
  registerStylesheetSource,
  removeMasterStyleDirectives,
  resolveMasterStyleSource,
  transformLocalStylesheet,
  type SassModule,
  type StylesheetSource,
  type StylesheetSources
} from './index'

export type { SassModule as MasterCSSSassCompiler, StylesheetPreparationOptions as MasterCSSStylesheetPreparationOptions, PreparedStylesheetSource as MasterCSSPreparedStylesheet } from './types'
import type { SassModule as MasterCSSSassCompiler } from './types'
export { prepareStylesheetSource as prepareStylesheet } from './index'

export interface MasterCSSStylesheetCompileOptions extends MasterCSSCompileOptions, StylesheetSourceContext {
  readonly delivery?: StylesheetDeliveryOptions
  readonly baseManifest: MasterCSSManifest
  readonly projectDir?: string
  readonly loadSass?: (projectDir?: string) => MasterCSSSassCompiler
  readonly signal?: AbortSignal
}

export interface MasterCSSRenderedStylesheetCompileOptions extends MasterCSSStylesheetCompileOptions {
  /** Globals already present outside this render; emit only additional resources. */
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSCompiledStylesheet extends MasterCSSCompileResult {
  readonly entry?: string
  /** Delivery assets, including the entry. Each map describes its final CSS. */
  readonly stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string, readonly sourceMap: string }[]
  readonly resources?: readonly StylesheetResourceAsset[]
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export interface MasterCSSStylesheetTransformResult {
  readonly diagnostics: readonly import('@master/css-schema').MasterCSSDiagnostic[]
  readonly sourceMap?: string
  /** Retained child stylesheets; delivery hosts must publish every returned asset. */
  readonly stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string }[]
  readonly resources?: readonly StylesheetResourceAsset[]
  readonly code: string
  readonly dependencies: readonly string[]
  readonly transformed: boolean
  readonly compilation?: MasterCSSCompileResult
}

export interface MasterCSSStylesheetTransformOptions extends MasterCSSStylesheetCompileOptions {
  /** With delivery, also process native graphs prepared by a host transformer. */
  readonly transformNativeStylesheets?: boolean
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSStylesheetResolutionOptions extends StylesheetSourceContext {
  readonly projectDir?: string
  /** Classify a prepared graph without flattening its CSS for delivery hosts. */
  readonly preserveImports?: boolean
  readonly signal?: AbortSignal
}

export interface MasterCSSStylesheetDependencyOptions {
  readonly projectDir?: string
  readonly signal?: AbortSignal
}

export interface MasterCSSStylesheetAsyncResolutionOptions extends MasterCSSStylesheetResolutionOptions {
  readonly baseFile?: string
  readonly resolveImport?: CSSImportFileResolver
  readonly onDependency?: (file: string) => void
}

export type MasterCSSStylesheetKind =
  | 'entry'
  | 'local'
  | 'master-package'
  | 'master-package-entry'
  | 'plain'

export interface MasterCSSStylesheetResolution {
  readonly id: string
  readonly kind: MasterCSSStylesheetKind
  readonly source: string
  readonly compilationSource: string
  readonly outputSource: string
  readonly dependencies: readonly string[]
}

export interface MasterCSSStylesheetHostOptions {
  readonly masterImport?: string
  readonly masterSource?: string
  readonly signal?: AbortSignal
}

export interface MasterCSSStylesheetCompositionOptions extends MasterCSSStylesheetCompileOptions {
  /** Compose only these registered source IDs; omitted selects all and an empty list selects none. */
  readonly sourceIds?: readonly string[]
  readonly scanner: MasterCSSScanner
  readonly manifest?: MasterCSSManifest
  readonly classes?: readonly string[]
  readonly includeGeneratedCSS?: boolean
  readonly includeNativeCSS?: boolean
  readonly includeMasterBaseCSS?: boolean
}

export interface MasterCSSStylesheetComposition {
  readonly diagnostics: readonly import('@master/css-schema').MasterCSSDiagnostic[]
  readonly stylesheets?: readonly { readonly id: string, readonly href: string, readonly css: string }[]
  readonly resources?: readonly StylesheetResourceAsset[]
  readonly dependencies?: readonly string[]
  readonly css: string
  readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export interface MasterCSSStylesheetSourceSnapshot {
  readonly id: string
  readonly source: string
  readonly dependencies: readonly string[]
  readonly sourceDependencies: readonly string[]
  readonly isMasterCSS: boolean
  readonly prunesNativeCSS: boolean
}

export interface MasterCSSStylesheetCollectionSnapshot {
  readonly size: number
  readonly sourceIds: readonly string[]
  readonly dependencies: readonly string[]
  readonly sources: readonly MasterCSSStylesheetSourceSnapshot[]
}

function abortableOptions<T extends { readonly signal?: AbortSignal }>(
  options: T
): Omit<T, 'signal'> {
  options.signal?.throwIfAborted()
  const { signal: _signal, ...compileOptions } = options
  return compileOptions
}

function freezeEmittedGlobals(
  emittedGlobals: Required<MasterCSSEmittedGlobals>
): Required<MasterCSSEmittedGlobals> {
  return Object.freeze({
    variables: Object.freeze({ ...emittedGlobals.variables }),
    animations: Object.freeze({ ...emittedGlobals.animations })
  })
}

function freezeCompilation(
  result: ReturnType<typeof toMasterCSSCompileResultInternal>
): MasterCSSCompileResult {
  return result
}

export function resolveStylesheetSync(
  id: string,
  source: string,
  options: MasterCSSStylesheetResolutionOptions = {}
): MasterCSSStylesheetResolution | undefined {
  options.signal?.throwIfAborted()
  if (!isStylesheetRequest(id)) return
  const normalizedId = cleanStyleRequest(id)
  try {
  const resolved = options.preserveImports
    ? resolveUnflattenedStylesheet(normalizedId, source, options.projectDir)
    : resolveMasterStyleSource(id, source, options.projectDir)
  return createStylesheetResolution(normalizedId, source, options, resolved)
  } catch (error) { throw mapStylesheetError(error, normalizedId, options, source) }
}

function createStylesheetResolution(
  normalizedId: string, source: string, options: MasterCSSStylesheetResolutionOptions,
  resolved: { source: string, dependencies: string[], local?: boolean } | undefined
): MasterCSSStylesheetResolution {
  const packageStyle = !normalizedId.startsWith('\0') && isMasterCSSPackageStyleFile(normalizedId, options.projectDir)
  const entry = resolved && !resolved.local
  const local = resolved?.local || (!resolved && hasLocalStyleDirectives(source, normalizedId))
  const kind: MasterCSSStylesheetKind = packageStyle
    ? entry
      ? 'master-package-entry'
      : 'master-package'
    : entry
      ? 'entry'
      : local
        ? 'local'
        : 'plain'
  const outputSource = packageStyle
    ? removeMasterStyleDirectives(source).code
    : source
  const compilationSource = resolved?.source ?? outputSource
  const dependencies = resolved?.dependencies
    ?? (kind === 'plain'
      ? [normalizedId]
      : collectStylesheetDependenciesInternal(normalizedId, source, options.projectDir))

  return Object.freeze({
    id: normalizedId,
    kind,
    source,
    compilationSource,
    outputSource,
    dependencies: Object.freeze([...new Set(dependencies)])
  })
}

function resolveUnflattenedStylesheet(id: string, source: string, projectDir?: string) {
  let graph: ReturnType<typeof prepareCSSImportGraph>
  try {
    graph = prepareCSSImportGraph(id, source, { projectDir, expandPackageImports: false }, analyzeCSSDependencies)
  } catch (error) {
    if (!inspectCSS(source).hasMasterEntry) return
    throw error
  }
  return classifyPreparedStylesheet(graph, source)
}

function classifyPreparedStylesheet(graph: ReturnType<typeof prepareCSSImportGraph>, source: string) {
  const files = Object.entries(graph.files)
  const entry = files.some(([, text]) => inspectCSS(text).hasMasterEntry)
  // Name the file being inspected: a directive diagnostic raised here otherwise
  // reports the compiler's default filename instead of the stylesheet it is in.
  if (!entry && !files.some(([file, text]) => hasLocalStyleDirectives(text, file))) return
  return { source, dependencies: Object.keys(graph.files), local: !entry }
}

export async function resolveStylesheet(
  id: string,
  source: string,
  options: MasterCSSStylesheetAsyncResolutionOptions = {}
): Promise<MasterCSSStylesheetResolution | undefined> {
  if (!options.resolveImport && !options.baseFile) return resolveStylesheetSync(id, source, options)
  options.signal?.throwIfAborted()
  if (!options.preserveImports) throw new TypeError('Custom import resolution requires preserveImports.')
  if (!isStylesheetRequest(id)) return
  const normalizedId = cleanStyleRequest(id)
  const graph = await prepareCSSImportGraphWithResolver(normalizedId, source, { projectDir: options.projectDir, expandPackageImports: false, onDependency: options.onDependency, signal: options.signal, baseFile: options.baseFile }, analyzeCSSDependencies, options.resolveImport ?? (() => undefined))
  options.signal?.throwIfAborted()
  const resolved = classifyPreparedStylesheet(graph, source)
  return createStylesheetResolution(normalizedId, source, options, resolved)
}

export function collectStylesheetDependenciesSync(
  id: string,
  source?: string,
  options: MasterCSSStylesheetDependencyOptions = {}
): readonly string[] {
  options.signal?.throwIfAborted()
  return Object.freeze(
    collectStylesheetDependenciesInternal(id, source, options.projectDir)
  )
}

export function collectStylesheetDependencies(
  id: string,
  source?: string,
  options: MasterCSSStylesheetDependencyOptions = {}
): Promise<readonly string[]> {
  return Promise.resolve(collectStylesheetDependenciesSync(id, source, options))
}

export function composeStylesheetHostSync(
  source: string,
  options: MasterCSSStylesheetHostOptions = {}
): string {
  options.signal?.throwIfAborted()
  return createStylesheetHostSource(source, options)
}

export function composeStylesheetHost(
  source: string,
  options: MasterCSSStylesheetHostOptions = {}
): Promise<string> {
  return Promise.resolve(composeStylesheetHostSync(source, options))
}

export async function compileStylesheet(
  id: string,
  source: string,
  options: MasterCSSStylesheetCompileOptions
): Promise<MasterCSSCompileResult> {
  assertValidationOptions(options)
  const compileOptions = abortableOptions(options)
  const result = await compileStylesheetInternal(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  return freezeCompilation(
    toMasterCSSCompileResultInternal(result, options.onDiagnostic, options.validation, stylesheetValidationSource(result.css, id, result.sourceMap))
  )
}

export async function compileRenderedStylesheet(
  id: string,
  source: string,
  options: MasterCSSRenderedStylesheetCompileOptions
): Promise<MasterCSSCompiledStylesheet> {
  assertValidationOptions(options)
  const compileOptions = abortableOptions(options)
  const result = await compileRenderedStylesheetInternal(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  const compilation = toMasterCSSCompileResultInternal(result, options.onDiagnostic, options.validation, stylesheetValidationSource(result.css, id, result.sourceMap))
  return Object.freeze({
    ...compilation,
    diagnostics: Object.freeze([...compilation.diagnostics, ...validateCompiledCSS((result.stylesheets ?? []).map(asset => stylesheetValidationSource(asset.css, asset.id, asset.sourceMap)), options)]),
    ...(result.stylesheets ? {
      entry: result.entry,
      stylesheets: Object.freeze(result.stylesheets.map(({ id, href, css, sourceMap }) => Object.freeze({ id, href, css, sourceMap }))),
      resources: Object.freeze((result.resources ?? []).map(asset => Object.freeze({ ...asset })))
    } : {}),
    manifest: Object.freeze(result.manifest),
    emittedGlobals: freezeEmittedGlobals(result.emittedGlobals)
  })
}

export async function collectStylesheetEmittedGlobals(
  entries: readonly string[],
  options: MasterCSSStylesheetCompileOptions
): Promise<Readonly<{
  emittedGlobals: Required<MasterCSSEmittedGlobals>
  dependencies: readonly string[]
}>> {
  assertValidationOptions(options)
  const compileOptions = abortableOptions(options)
  const result = await createStyleEntryEmittedGlobals([...entries], {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  return Object.freeze({
    emittedGlobals: freezeEmittedGlobals(result.emittedGlobals),
    dependencies: Object.freeze([...result.dependencies])
  })
}

export async function transformStylesheet(
  id: string,
  source: string,
  options: MasterCSSStylesheetTransformOptions
): Promise<MasterCSSStylesheetTransformResult> {
  assertValidationOptions(options)
  const compileOptions = abortableOptions(options)
  const result = await transformLocalStylesheet(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  return Object.freeze({
    code: result.code,
    diagnostics: validateCompiledCSS([stylesheetValidationSource(result.code, id, result.result?.sourceMap), ...(result.stylesheets ?? []).map(asset => stylesheetValidationSource(asset.css, asset.id, asset.sourceMap))], options),
    ...(result.result?.sourceMap ? { sourceMap: result.result.sourceMap } : {}),
    dependencies: Object.freeze([...result.dependencies]),
    transformed: result.transformed,
    ...(result.stylesheets ? { stylesheets: Object.freeze(result.stylesheets.map(asset => Object.freeze({ ...asset }))) } : {}),
    ...(result.resources ? { resources: Object.freeze(result.resources.map(asset => Object.freeze({ ...asset }))) } : {}),
    ...(result.result
      ? {
        compilation: toMasterCSSCompileResultInternal(
          result.result,
          options.onDiagnostic,
          options.validation
        )
      }
      : {})
  })
}

let bindStylesheetCollection: () => MasterCSSStylesheetCollection

export class MasterCSSStylesheetCollection implements Disposable {
  readonly #sources: StylesheetSources = new Map()
  #disposed = false
  #scanners = new Map<string, MasterCSSScanner>()
  #sourceIDs = new Map<string, string>()

  private constructor() { }

  get size() {
    this.assertActive()
    return this.#sources.size
  }

  async register(
    scanner: MasterCSSScanner,
    id: string,
    source: string,
    options: MasterCSSStylesheetCompileOptions
  ): Promise<MasterCSSCompileResult> {
    this.assertActive()
    assertValidationOptions(options)
    let compileOptions = abortableOptions(options)
    const resolveImport = compileOptions.delivery?.resolveImport
    if (resolveImport) {
      compileOptions = { ...compileOptions, delivery: { ...compileOptions.delivery!, resolveImport: async (specifier, importer) => {
        this.assertActive()
        options.signal?.throwIfAborted()
        const result = await resolveImport(specifier, importer)
        this.assertActive()
        options.signal?.throwIfAborted()
        return result
      } } }
    }
    const previousSources = new Map(this.#sources)
    const stagedSources = new Map(previousSources)
    const nativeRegistrations: [string, string[]][] = []
    const stagedScanner = Object.create(scanner) as MasterCSSScanner
    stagedScanner.registerNativeClasses = (owner, names) => { nativeRegistrations.push([owner, names]); return false }
    const result = await registerStylesheetSource(
      stagedScanner,
      stagedSources,
      id,
      source,
      {
        ...compileOptions,
        loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
      }
    )
    options.signal?.throwIfAborted()
    const compilation = toMasterCSSCompileResultInternal(result, options.onDiagnostic, options.validation, stylesheetValidationSource(result.css, id, result.sourceMap))
    this.assertActive()
    for (const [key, staged] of stagedSources) {
      if (previousSources.get(key) === staged) continue
      this.#sources.set(key, staged)
      this.#scanners.set(key, scanner)
      this.#sourceIDs.set(id, key)
    }
    for (const [owner, names] of nativeRegistrations) scanner.registerNativeClasses(owner, names)
    return compilation
  }

  delete(id: string): boolean {
    this.assertActive()
    const key = this.#sourceIDs.get(id) ?? normalizeStylesheetGraphID(cleanStyleRequest(id))
    this.#sourceIDs.delete(id)
    this.#scanners.get(key)?.removeOwner(key)
    this.#scanners.delete(key)
    return this.#sources.delete(key)
  }

  clear(): void {
    this.assertActive()
    for (const [id, scanner] of this.#scanners) { if (scanner.initialized) scanner.removeOwner(id) }
    this.#scanners.clear()
    this.#sourceIDs.clear()
    this.#sources.clear()
  }

  async compose(
    options: MasterCSSStylesheetCompositionOptions
  ): Promise<MasterCSSStylesheetComposition> {
    this.assertActive()
    const { sourceIds, ...compileOptions } = abortableOptions(options)
    const selected = sourceIds && new Set(sourceIds.map(cleanStyleRequest))
    const result = await createExtractedCSSResult({
      ...compileOptions,
      scanner: options.scanner,
      stylesheetSources: selected
        ? new Map([...this.#sources].filter(([id]) => selected.has(id)))
        : this.#sources,
      loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
    })
    options.signal?.throwIfAborted()
    return Object.freeze({
      css: result.css,
      diagnostics: validateCompiledCSS([{ css: result.css }, ...(result.stylesheets ?? []).map(asset => stylesheetValidationSource(asset.css, asset.id, asset.sourceMap))], options),
      ...(result.stylesheets ? { stylesheets: Object.freeze(result.stylesheets.map(asset => Object.freeze({ ...asset }))) } : {}),
      ...(result.resources ? { resources: Object.freeze(result.resources.map(asset => Object.freeze({ ...asset }))) } : {}),
      ...(result.dependencies ? { dependencies: Object.freeze([...result.dependencies]) } : {}),
      emittedGlobals: freezeEmittedGlobals(result.emittedGlobals)
    })
  }

  snapshot(): MasterCSSStylesheetCollectionSnapshot {
    this.assertActive()
    const sources = Object.freeze(
      [...this.#sources.entries()].map(([id, source]) =>
        freezeSourceSnapshot(id, source)
      )
    )
    return Object.freeze({
      size: sources.length,
      sourceIds: Object.freeze(sources.map(({ id }) => id)),
      dependencies: Object.freeze([
        ...new Set(sources.flatMap(({ dependencies }) => dependencies))
      ]),
      sources
    })
  }

  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    for (const [id, scanner] of this.#scanners) { if (scanner.initialized) scanner.removeOwner(id) }
    this.#scanners.clear()
    this.#sourceIDs.clear()
    this.#sources.clear()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  private assertActive(): void {
    if (this.#disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'compiler',
        message: 'The Master CSS stylesheet collection has been disposed.'
      })
    }
  }

  static {
    bindStylesheetCollection = () => new MasterCSSStylesheetCollection()
  }
}

function freezeSourceSnapshot(
  id: string,
  source: StylesheetSource
): MasterCSSStylesheetSourceSnapshot {
  return Object.freeze({
    id,
    source: source.source,
    dependencies: Object.freeze([...source.dependencies]),
    sourceDependencies: Object.freeze([...source.sourceDependencies]),
    isMasterCSS: source.masterCSS,
    prunesNativeCSS: source.pruneNativeCSS
  })
}

export function createStylesheetCollection(): MasterCSSStylesheetCollection {
  return bindStylesheetCollection()
}
