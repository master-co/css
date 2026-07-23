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

export interface MasterCSSSassCompiler {
  compileStringAsync(source: string, options: {
    readonly url: URL
    readonly style: 'expanded'
    readonly syntax: 'scss' | 'indented'
  }): Promise<{ readonly css: string }>
}

export interface MasterCSSStylesheetCompileOptions extends MasterCSSCompileOptions {
  readonly baseManifest: MasterCSSManifest
  readonly projectDir?: string
  readonly loadSass?: (projectDir?: string) => MasterCSSSassCompiler
  readonly signal?: AbortSignal
}

export interface MasterCSSCompiledStylesheet extends MasterCSSCompileResult {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals: Required<MasterCSSEmittedGlobals>
}

export interface MasterCSSStylesheetTransformResult {
  readonly code: string
  readonly dependencies: readonly string[]
  readonly transformed: boolean
  readonly compilation?: MasterCSSCompileResult
}

export interface MasterCSSStylesheetTransformOptions extends MasterCSSStylesheetCompileOptions {
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSStylesheetResolutionOptions {
  readonly projectDir?: string
  readonly signal?: AbortSignal
}

export interface MasterCSSStylesheetDependencyOptions {
  readonly projectDir?: string
  readonly signal?: AbortSignal
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
  readonly scanner: MasterCSSScanner
  readonly manifest?: MasterCSSManifest
  readonly classes?: readonly string[]
  readonly includeGeneratedCSS?: boolean
  readonly includeNativeCSS?: boolean
  readonly includeMasterBaseCSS?: boolean
}

export interface MasterCSSStylesheetComposition {
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
  const packageStyle = isMasterCSSPackageStyleFile(id, options.projectDir)
  const resolved = resolveMasterStyleSource(id, source, options.projectDir)
  const local = !resolved && hasLocalStyleDirectives(source)
  const kind: MasterCSSStylesheetKind = packageStyle
    ? resolved
      ? 'master-package-entry'
      : 'master-package'
    : resolved
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
      : collectStylesheetDependenciesInternal(id, source, options.projectDir))

  return Object.freeze({
    id: normalizedId,
    kind,
    source,
    compilationSource,
    outputSource,
    dependencies: Object.freeze([...new Set(dependencies)])
  })
}

export function resolveStylesheet(
  id: string,
  source: string,
  options: MasterCSSStylesheetResolutionOptions = {}
): Promise<MasterCSSStylesheetResolution | undefined> {
  return Promise.resolve(resolveStylesheetSync(id, source, options))
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
  const compileOptions = abortableOptions(options)
  const result = await compileStylesheetInternal(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  return freezeCompilation(
    toMasterCSSCompileResultInternal(result, options.onDiagnostic)
  )
}

export async function compileRenderedStylesheet(
  id: string,
  source: string,
  options: MasterCSSStylesheetCompileOptions
): Promise<MasterCSSCompiledStylesheet> {
  const compileOptions = abortableOptions(options)
  const result = await compileRenderedStylesheetInternal(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  const compilation = toMasterCSSCompileResultInternal(result, options.onDiagnostic)
  return Object.freeze({
    ...compilation,
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
  const compileOptions = abortableOptions(options)
  const result = await transformLocalStylesheet(id, source, {
    ...compileOptions,
    loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
  })
  options.signal?.throwIfAborted()
  return Object.freeze({
    code: result.code,
    dependencies: Object.freeze([...result.dependencies]),
    transformed: result.transformed,
    ...(result.result
      ? {
        compilation: toMasterCSSCompileResultInternal(
          result.result,
          options.onDiagnostic
        )
      }
      : {})
  })
}

let bindStylesheetCollection: () => MasterCSSStylesheetCollection

export class MasterCSSStylesheetCollection implements Disposable {
  readonly #sources: StylesheetSources = new Map()
  #disposed = false

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
    const compileOptions = abortableOptions(options)
    const result = await registerStylesheetSource(
      scanner,
      this.#sources,
      id,
      source,
      {
        ...compileOptions,
        loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
      }
    )
    options.signal?.throwIfAborted()
    return toMasterCSSCompileResultInternal(result, options.onDiagnostic)
  }

  delete(id: string): boolean {
    this.assertActive()
    return this.#sources.delete(cleanStyleRequest(id))
  }

  clear(): void {
    this.assertActive()
    this.#sources.clear()
  }

  async compose(
    options: MasterCSSStylesheetCompositionOptions
  ): Promise<MasterCSSStylesheetComposition> {
    this.assertActive()
    const compileOptions = abortableOptions(options)
    const result = await createExtractedCSSResult({
      ...compileOptions,
      scanner: options.scanner,
      stylesheetSources: this.#sources,
      loadSass: compileOptions.loadSass as ((projectDir?: string) => SassModule) | undefined
    })
    options.signal?.throwIfAborted()
    return Object.freeze({
      css: result.css,
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
