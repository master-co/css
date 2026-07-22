import { loadNativeBinding, NativeBindingError } from '@master/css-native'
import { createCompilerWasmSession, type CompilerWasmSession } from '@master/css-wasm-compiler'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'

export interface CompilerSession {
  readonly backend: 'native' | 'wasm'
  inspectCSS<T = unknown>(source: string): T
  compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult
  compileThemeCSS<T = unknown>(source: string, options?: unknown): T
  analyzeCSSDependencies<T = unknown>(source: string): T
  analyzeStandaloneDirectives<T = unknown>(source: string): T
  mergeCSSExtractionPolicies<T = unknown>(policies: unknown): T
  filterCSSExtractionCandidates(candidates: string[], blocklist: unknown): string[]
  compileManifestInput<T = unknown>(input: unknown, options?: unknown): T
  lowerCSSDirectives<T = unknown>(request: unknown, options?: unknown): T
  normalizeManifest<T = unknown>(manifest: unknown): T
  normalizeDefaultManifest<T = unknown>(manifest: unknown): T
  compileDefaultPresetManifest<T = unknown>(request: unknown): T
  resolveCSSImportGraph<T = unknown>(request: unknown): T
  dispose(): void
}

export class CompilerSessionError extends Error {
  constructor(
    public readonly code: 'NATIVE_UNAVAILABLE' | 'SESSION_DISPOSED',
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'CompilerSessionError'
  }
}

function reviveCompileResult(result: CompileCSSResult) {
  result.extractionPolicy.blocklist = result.extractionPolicy.blocklist.map((entry) => {
    if (entry && typeof entry === 'object' && 'source' in entry && typeof entry.source === 'string') {
      return new RegExp(entry.source, 'flags' in entry && typeof entry.flags === 'string' ? entry.flags : '')
    }
    return entry
  })
  return result
}

function nativeJSON<T>(call: () => string): T {
  return JSON.parse(call()) as T
}

function withLifecycle(backend: CompilerSession['backend'], operations: Omit<CompilerSession, 'backend' | 'dispose'>): CompilerSession {
  let disposed = false
  const call = <T>(operation: () => T) => {
    if (disposed) throw new CompilerSessionError('SESSION_DISPOSED', 'Master CSS compiler session has been disposed.')
    return operation()
  }
  return {
    backend,
    inspectCSS: (source) => call(() => operations.inspectCSS(source)),
    compileCSS: (source, options) => call(() => operations.compileCSS(source, options)),
    compileThemeCSS: (source, options) => call(() => operations.compileThemeCSS(source, options)),
    analyzeCSSDependencies: (source) => call(() => operations.analyzeCSSDependencies(source)),
    analyzeStandaloneDirectives: (source) => call(() => operations.analyzeStandaloneDirectives(source)),
    mergeCSSExtractionPolicies: (policies) => call(() => operations.mergeCSSExtractionPolicies(policies)),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      call(() => operations.filterCSSExtractionCandidates(candidates, blocklist)),
    compileManifestInput: (input, options) => call(() => operations.compileManifestInput(input, options)),
    lowerCSSDirectives: (request, options) => call(() => operations.lowerCSSDirectives(request, options)),
    normalizeManifest: (manifest) => call(() => operations.normalizeManifest(manifest)),
    normalizeDefaultManifest: (manifest) => call(() => operations.normalizeDefaultManifest(manifest)),
    compileDefaultPresetManifest: (request) => call(() => operations.compileDefaultPresetManifest(request)),
    resolveCSSImportGraph: (request) => call(() => operations.resolveCSSImportGraph(request)),
    dispose() {
      disposed = true
    }
  }
}

export function createNativeCompilerSession(): CompilerSession | undefined {
  const loaded = loadNativeBinding()
  if (!loaded) return
  const binding = loaded.binding
  return withLifecycle('native', {
    inspectCSS: (source) => nativeJSON(() => binding.inspectCssJson(source)),
    compileCSS(source, options = {}) {
      const result = nativeJSON<CompileCSSResult>(() => binding.compileCssDirectivesJson(source, JSON.stringify({
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      })))
      for (const warning of result.warnings) options.onWarning?.(warning)
      return reviveCompileResult(result)
    },
    compileThemeCSS: (source, options) => nativeJSON(() => binding.compileThemeCssJson(source, options === undefined ? undefined : JSON.stringify(options))),
    analyzeCSSDependencies: (source) => nativeJSON(() => binding.analyzeCssDependenciesJson(source)),
    analyzeStandaloneDirectives: (source) => nativeJSON(() => binding.analyzeStandaloneDirectivesJson(source)),
    mergeCSSExtractionPolicies: (policies) => nativeJSON(() => binding.mergeCssExtractionPoliciesJson(JSON.stringify(policies))),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      binding.filterCssExtractionCandidates(candidates, JSON.stringify(blocklist)),
    compileManifestInput: (input, options) => nativeJSON(() => binding.compileManifestInputJson(JSON.stringify(input), options === undefined ? undefined : JSON.stringify(options))),
    lowerCSSDirectives: (request, options) => nativeJSON(() => binding.lowerCssDirectivesJson(JSON.stringify(request), options === undefined ? undefined : JSON.stringify(options))),
    normalizeManifest: (manifest) => nativeJSON(() => binding.normalizeManifestJson(JSON.stringify(manifest))),
    normalizeDefaultManifest: (manifest) => nativeJSON(() => binding.normalizeDefaultManifestJson(JSON.stringify(manifest))),
    compileDefaultPresetManifest: (request) => nativeJSON(() => binding.compileDefaultPresetManifestJson(JSON.stringify(request))),
    resolveCSSImportGraph: (request) => nativeJSON(() => binding.resolveCssImportGraphJson(JSON.stringify(request)))
  })
}

export function bindWasmCompilerSession(session: CompilerWasmSession): CompilerSession {
  return withLifecycle('wasm', {
    inspectCSS: (source) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      const result = reviveCompileResult(session.compileCSSDirectives<CompileCSSResult>(source, options))
      for (const warning of result.warnings) options.onWarning?.(warning)
      return result
    },
    compileThemeCSS: (source, options) => session.compileThemeCSS(source, options),
    analyzeCSSDependencies: (source) => session.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source) => session.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (policies) => session.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      session.filterCSSExtractionCandidates(candidates, blocklist),
    compileManifestInput: (input, options) => session.compileManifestInput(input, options),
    lowerCSSDirectives: (request, options) => session.lowerCSSDirectives(request, options),
    normalizeManifest: (manifest) => session.normalizeManifestForJSON(manifest),
    normalizeDefaultManifest: (manifest) => session.normalizeDefaultManifestForJSON(manifest),
    compileDefaultPresetManifest: (request) => session.compileDefaultPresetManifest(request),
    resolveCSSImportGraph: (request) => session.resolveCSSImportGraph(request)
  })
}

export async function createCompiler(): Promise<CompilerSession> {
  const native = createNativeCompilerSession()
  if (native) return native
  return bindWasmCompilerSession(await createCompilerWasmSession())
}

export function createCompilerSync(): CompilerSession {
  try {
    const compiler = createNativeCompilerSession()
    if (compiler) return compiler
  } catch (cause) {
    if (cause instanceof NativeBindingError) {
      throw new CompilerSessionError('NATIVE_UNAVAILABLE', cause.message, { cause })
    }
    throw cause
  }
  throw new CompilerSessionError(
    'NATIVE_UNAVAILABLE',
    'createCompilerSync() requires the Master CSS native binding.'
  )
}
