import { validateCompiledCSS, type ValidationSource } from './value-validation'
import {
  MASTER_CSS_DIAGNOSTIC_VERSION,
  MasterCSSError,
  type MasterCSSDiagnostic
} from '@master/css-schema'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSCompileManifestOptions,
  MasterCSSCompileManifestResult,
  MasterCSSCompileOptions,
  MasterCSSCompileResult,
  MasterCSSPrepareStylesheetBundleRequest,
  MasterCSSStylesheetBundle,
  MasterCSSRenderStylesheetBundleRequest,
  MasterCSSStylesheetAsset,
  MasterCSSCompileStylesheetsRequest,
  MasterCSSCompileStylesheetsResult,
  MasterCSSCompilerInspection
} from './index'
import type { CompileCSSResult } from './contracts'
import type { BindingCompilerSession } from './session'

function warningDiagnostic(message: string): MasterCSSDiagnostic {
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'COMPILER_WARNING',
    domain: 'compiler',
    phase: 'compiler',
    severity: 'warning',
    message
  })
}

function diagnosticsFor(
  warnings: readonly string[],
  onDiagnostic: ((diagnostic: MasterCSSDiagnostic) => void) | undefined
) {
  const diagnostics = Object.freeze(warnings.map(warningDiagnostic))
  for (const diagnostic of diagnostics) onDiagnostic?.(diagnostic)
  return diagnostics
}

function countRecordValue(value: unknown) {
  if (Array.isArray(value)) return value.length
  return value && typeof value === 'object' ? Object.keys(value).length : 0
}

function freezeExtractionPolicy(
  policy: CompileCSSResult['extractionPolicy']
) {
  return Object.freeze({
    include: Object.freeze([...policy.include]),
    exclude: Object.freeze([...policy.exclude]),
    safelist: Object.freeze([...policy.safelist]),
    blocklist: Object.freeze([...policy.blocklist]),
    preserveNative: policy.preserveNative,
    pruneNative: policy.pruneNative
  })
}

function directiveSummary(result: CompileCSSResult) {
  const manifestInput = result.manifestInput as Record<string, unknown>
  const keys = Object.freeze(Object.keys(manifestInput))
  const countKeys = [
    'settings',
    'variables',
    'utilities',
    'variants',
    'conditions',
    'selectors',
    'animations'
  ] as const
  return Object.freeze({
    manifestInput: Object.freeze({
      keys,
      counts: Object.freeze(Object.fromEntries(
        countKeys.map((key) => [key, countRecordValue(manifestInput[key])])
      ))
    }),
    styleDefinitions: (result.styleDefinitions?.length ?? 0) + (result.manifestInput.utilities ?? []).reduce((count, definition) => count + (definition.body?.length ?? 0), 0),
    extractionPolicy: freezeExtractionPolicy(result.extractionPolicy)
  })
}

/** @internal */
export function toMasterCSSCompileResultInternal(
  result: CompileCSSResult,
  onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void,
  validation?: 'report' | 'error',
  origin?: Omit<ValidationSource, 'css'>
): MasterCSSCompileResult {
  return Object.freeze({
    css: result.css,
    compositions: Object.freeze([...(result.compositions ?? [])]),
    ...(result.sourceMap ? { sourceMap: result.sourceMap } : {}),
    nativeCSS: result.nativeCSS,
    generatedCSS: result.generatedCSS,
    dependencies: Object.freeze([...result.dependencies]),
    classNames: Object.freeze([...result.classNames]),
    nativeClassNames: Object.freeze([...result.nativeClassNames]),
    diagnostics: Object.freeze([...diagnosticsFor(result.warnings, onDiagnostic), ...validateCompiledCSS([{ css: result.css, mappings: result.outputMappings ?? result.nativeMappings, ...origin }], { onDiagnostic, validation })]),
    directiveSummary: directiveSummary(result)
  })
}

interface InternalManifestCompileResult {
  readonly compositions?: CompileCSSResult['compositions']
  readonly css: string
  readonly nativeCSS: string
  readonly generatedCSS: string
  readonly dependencies: readonly string[]
  readonly classNames: readonly string[]
  readonly nativeClassNames: readonly string[]
  readonly warnings: readonly string[]
  readonly manifest: MasterCSSManifest
  readonly directives: CompileCSSResult
  readonly outputMappings?: CompileCSSResult['outputMappings']
  readonly sourceTexts?: Record<string, string>
}

/** @internal */
export function toMasterCSSCompileManifestResultInternal(
  result: InternalManifestCompileResult,
  onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void,
  validation?: 'report' | 'error'
): MasterCSSCompileManifestResult {
  return Object.freeze({
    css: result.css,
    compositions: Object.freeze([...(result.compositions ?? [])]),
    nativeCSS: result.nativeCSS,
    generatedCSS: result.generatedCSS,
    dependencies: Object.freeze([...result.dependencies]),
    classNames: Object.freeze([...result.classNames]),
    nativeClassNames: Object.freeze([...result.nativeClassNames]),
    diagnostics: Object.freeze([...diagnosticsFor(result.warnings, onDiagnostic), ...validateCompiledCSS([{ css: result.css, mappings: result.outputMappings, sources: result.sourceTexts }], { onDiagnostic, validation })]),
    directiveSummary: directiveSummary(result.directives),
    manifest: Object.freeze(result.manifest),
    directives: toMasterCSSCompileResultInternal(result.directives)
  })
}

let bindCompilerSession: (session: BindingCompilerSession) => MasterCSSCompiler

export class MasterCSSCompiler implements Disposable {
  #session!: BindingCompilerSession
  #disposed = false

  private constructor() { }

  get binding() {
    return this.#session.binding
  }

  inspectCSS(source: string): MasterCSSCompilerInspection {
    this.assertActive()
    const inspection = this.#session.inspectCSS(source) as MasterCSSCompilerInspection
    return Object.freeze({
      ...inspection,
      directives: Object.freeze(inspection.directives.map((directive) => Object.freeze({
        ...directive,
        range: Object.freeze({ ...directive.range }),
        preludeRange: Object.freeze({ ...directive.preludeRange })
      })))
    })
  }

  compileCSS(
    source: string,
    options: MasterCSSCompileOptions = {}
  ): MasterCSSCompileResult {
    this.assertActive()
    return toMasterCSSCompileResultInternal(
      this.#session.compileCSS(source, options),
      options.onDiagnostic,
      options.validation,
      { source: options.from ?? '<stylesheet>', sources: { [options.from ?? '<stylesheet>']: source } }
    )
  }

  compileManifest(
    source: string,
    options: MasterCSSCompileManifestOptions
  ): MasterCSSCompileManifestResult {
    this.assertActive()
    const rawDirectives = this.#session.compileCSS(source, options)
    const origin = { source: options.from ?? '<stylesheet>', sources: { [options.from ?? '<stylesheet>']: source } }
    const directives = toMasterCSSCompileResultInternal(rawDirectives, undefined, undefined, origin)
    if (rawDirectives.references?.length) {
      throw new MasterCSSError({
        code: 'UNRESOLVED_REFERENCE',
        domain: 'compiler',
        message: 'Universal manifest compilation cannot resolve @reference directives.'
      })
    }
    const lowered = this.#session.lowerCSSDirectives({
      manifestInput: rawDirectives.manifestInput,
      utilitySources: rawDirectives.utilitySources || [],
      nativeOutput: rawDirectives.nativeOutput,
      styleDefinitions: rawDirectives.styleDefinitions || [],
      warnings: rawDirectives.warnings
    }, {
      baseManifest: options.baseManifest
    }, source) as {
      manifest: MasterCSSManifest
      compositions: NonNullable<CompileCSSResult['compositions']>
      warnings: string[]
      generatedCSS: string
      outputMappings?: CompileCSSResult['outputMappings']
      css?: string
    }
    const generatedCSS = lowered.generatedCSS || ''
    const css = lowered.css ?? [rawDirectives.nativeCSS, generatedCSS].filter(Boolean).join('\n')
    const diagnostics = Object.freeze([...diagnosticsFor(lowered.warnings, options.onDiagnostic), ...validateCompiledCSS([{ css, mappings: lowered.outputMappings ?? rawDirectives.nativeMappings, ...origin }], options)])
    return Object.freeze({
      css,
      nativeCSS: rawDirectives.nativeCSS,
      compositions: Object.freeze([...(lowered.compositions ?? [])]),
      generatedCSS,
      classNames: Object.freeze([...rawDirectives.classNames]),
      nativeClassNames: Object.freeze([...rawDirectives.nativeClassNames]),
      diagnostics,
      directiveSummary: directiveSummary(rawDirectives),
      dependencies: Object.freeze([]),
      manifest: Object.freeze(lowered.manifest),
      directives
    })
  }

  dispose() {
    if (this.#disposed) return
    this.#session.dispose()
    this.#disposed = true
  }

  prepareStylesheetBundle(request: MasterCSSPrepareStylesheetBundleRequest): MasterCSSStylesheetBundle {
    this.assertActive()
    const result = this.#session.prepareCSSStylesheetBundle(request)
    return Object.freeze({
      ...result,
      graph: Object.freeze({
        ...result.graph,
        references: Object.freeze(result.graph.references.map(reference => Object.freeze({ ...reference }))),
        stylesheets: Object.freeze(result.graph.stylesheets.map(stylesheet => Object.freeze({
          ...stylesheet,
          imports: Object.freeze(stylesheet.imports.map(edge => Object.freeze({ ...edge })))
        })))
      }),
      sources: Object.freeze(result.sources.map(source => Object.freeze({
        ...source,
        range: Object.freeze({ ...source.range }),
        resources: Object.freeze(source.resources.map(resource => Object.freeze({ ...resource }))),
        imports: Object.freeze(source.imports.map(resource => Object.freeze({ ...resource })))
      })))
    })
  }

  renderStylesheetBundle(request: MasterCSSRenderStylesheetBundleRequest): readonly MasterCSSStylesheetAsset[] {
    this.assertActive()
    return Object.freeze(this.#session.renderCSSStylesheetBundle(request).map(asset => Object.freeze({ ...asset })))
  }

  compileStylesheets(request: MasterCSSCompileStylesheetsRequest, options: MasterCSSCompileOptions = {}): MasterCSSCompileStylesheetsResult {
    this.assertActive()
    const result = this.#session.compileCSSStylesheetGraph(request)
    const directives = toMasterCSSCompileResultInternal(result.directives)
    return Object.freeze({
      ...directives,
      diagnostics: Object.freeze([...directives.diagnostics, ...validateCompiledCSS(result.stylesheets.map(asset => ({ css: asset.css, source: asset.id, mappings: asset.outputMappings, sources: request.graph.files })), options)]),
      entry: result.entry,
      stylesheets: Object.freeze(result.stylesheets.map(stylesheet => Object.freeze({ ...stylesheet }))),
      manifest: Object.freeze(result.manifest),
      directives
    })
  }

  [Symbol.dispose]() {
    this.dispose()
  }

  private assertActive() {
    if (this.#disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'compiler',
        message: 'The Master CSS compiler has been disposed.'
      })
    }
  }

  static {
    bindCompilerSession = (session) => {
      const compiler = new MasterCSSCompiler()
      compiler.#session = session
      return compiler
    }
  }
}

/** @internal */
export function bindCompilerSessionInternal(session: BindingCompilerSession) {
  return bindCompilerSession(session)
}
