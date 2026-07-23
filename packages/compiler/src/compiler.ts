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
  MasterCSSCompilerInspection
} from './index'
import type { CompileCSSResult } from './contracts'
import type { BackendCompilerSession } from './session'

function warningDiagnostic(message: string): MasterCSSDiagnostic {
  return Object.freeze({
    version: MASTER_CSS_DIAGNOSTIC_VERSION,
    code: 'COMPILER_WARNING',
    domain: 'compiler',
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
    preserveNative: policy.preserveNative
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
    styleDefinitions: result.styleDefinitions?.length ?? 0,
    extractionPolicy: freezeExtractionPolicy(result.extractionPolicy)
  })
}

/** @internal */
export function toMasterCSSCompileResultInternal(
  result: CompileCSSResult,
  onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
): MasterCSSCompileResult {
  return Object.freeze({
    css: result.css,
    nativeCSS: result.nativeCSS,
    generatedCSS: result.generatedCSS,
    dependencies: Object.freeze([...result.dependencies]),
    classNames: Object.freeze([...result.classNames]),
    nativeClassNames: Object.freeze([...result.nativeClassNames]),
    diagnostics: diagnosticsFor(result.warnings, onDiagnostic),
    directiveSummary: directiveSummary(result)
  })
}

interface InternalManifestCompileResult {
  readonly css: string
  readonly nativeCSS: string
  readonly generatedCSS: string
  readonly dependencies: readonly string[]
  readonly classNames: readonly string[]
  readonly nativeClassNames: readonly string[]
  readonly warnings: readonly string[]
  readonly manifest: MasterCSSManifest
  readonly directives: CompileCSSResult
}

/** @internal */
export function toMasterCSSCompileManifestResultInternal(
  result: InternalManifestCompileResult,
  onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
): MasterCSSCompileManifestResult {
  return Object.freeze({
    css: result.css,
    nativeCSS: result.nativeCSS,
    generatedCSS: result.generatedCSS,
    dependencies: Object.freeze([...result.dependencies]),
    classNames: Object.freeze([...result.classNames]),
    nativeClassNames: Object.freeze([...result.nativeClassNames]),
    diagnostics: diagnosticsFor(result.warnings, onDiagnostic),
    directiveSummary: directiveSummary(result.directives),
    manifest: Object.freeze(result.manifest),
    directives: toMasterCSSCompileResultInternal(result.directives)
  })
}

let bindCompilerSession: (session: BackendCompilerSession) => MasterCSSCompiler

export class MasterCSSCompiler implements Disposable {
  #session!: BackendCompilerSession
  #disposed = false

  private constructor() { }

  get backend() {
    return this.#session.backend
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
      options.onDiagnostic
    )
  }

  compileManifest(
    source: string,
    options: MasterCSSCompileManifestOptions
  ): MasterCSSCompileManifestResult {
    this.assertActive()
    const rawDirectives = this.#session.compileCSS(source, options)
    const directives = toMasterCSSCompileResultInternal(rawDirectives)
    if (rawDirectives.references?.length) {
      throw new MasterCSSError({
        code: 'UNRESOLVED_REFERENCE',
        domain: 'compiler',
        message: 'Universal manifest compilation cannot resolve @reference directives.'
      })
    }
    const lowered = this.#session.lowerCSSDirectives({
      manifestInput: rawDirectives.manifestInput,
      styleDefinitions: rawDirectives.styleDefinitions || [],
      warnings: rawDirectives.warnings
    }, {
      baseManifest: options.baseManifest
    }) as {
      manifest: MasterCSSManifest
      warnings: string[]
      generatedCSS: string
    }
    const diagnostics = diagnosticsFor(lowered.warnings, options.onDiagnostic)
    const generatedCSS = lowered.generatedCSS || ''
    const css = [rawDirectives.nativeCSS, generatedCSS].filter(Boolean).join('\n')
    return Object.freeze({
      css,
      nativeCSS: rawDirectives.nativeCSS,
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
export function bindCompilerSessionInternal(session: BackendCompilerSession) {
  return bindCompilerSession(session)
}
