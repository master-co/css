import { loadNativeCompilerBackend } from '@master/css-backend/compiler'
import { MasterCSSError } from '@master/css-schema'
import { createCompilerWasmSession, type CompilerWasmSession } from '@master/css-wasm-compiler'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'

export interface BackendCompilerSession {
  readonly backend: 'native' | 'wasm'
  inspectCSS(source: string): unknown
  compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult
  compileThemeCSS(source: string, options?: unknown): unknown
  analyzeCSSDependencies(source: string): unknown
  analyzeStandaloneDirectives(source: string): unknown
  mergeCSSExtractionPolicies(policies: unknown): unknown
  filterCSSExtractionCandidates(candidates: string[], blocklist: unknown): string[]
  compileManifestInput(input: unknown, options?: unknown): unknown
  lowerCSSDirectives(request: unknown, options?: unknown): unknown
  normalizeManifest(manifest: unknown): unknown
  normalizeDefaultManifest(manifest: unknown): unknown
  compileDefaultPresetManifest(request: unknown): unknown
  resolveCSSImportGraph(request: unknown): unknown
  dispose(): void
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

function withLifecycle(
  backend: BackendCompilerSession['backend'],
  operations: Omit<BackendCompilerSession, 'backend' | 'dispose'>
): BackendCompilerSession {
  let disposed = false
  const call = <T>(operation: () => T) => {
    if (disposed) {
      throw new MasterCSSError({
        code: 'SESSION_DISPOSED',
        domain: 'compiler',
        message: 'The Master CSS compiler has been disposed.'
      })
    }
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

export function createNativeCompilerSession(): BackendCompilerSession | undefined {
  const compiler = loadNativeCompilerBackend()
  if (!compiler) return
  return withLifecycle('native', {
    inspectCSS: (source) => compiler.inspectCSS(source),
    compileCSS(source, options = {}) {
      const result = compiler.compileCSSDirectives(source, {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      }) as CompileCSSResult
      return reviveCompileResult(result as CompileCSSResult)
    },
    compileThemeCSS: (source, options) => compiler.compileThemeCSS(source, options),
    analyzeCSSDependencies: (source) => compiler.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source) => compiler.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (policies) => compiler.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      [...compiler.filterCSSExtractionCandidates(candidates, blocklist)],
    compileManifestInput: (input, options) => compiler.compileManifestInput(input, options),
    lowerCSSDirectives: (request, options) => compiler.lowerCSSDirectives(request, options),
    normalizeManifest: (manifest) => compiler.normalizeManifest(manifest),
    normalizeDefaultManifest: (manifest) => compiler.normalizeDefaultManifest(manifest),
    compileDefaultPresetManifest: (request) => compiler.compileDefaultPresetManifest(request),
    resolveCSSImportGraph: (request) => compiler.resolveCSSImportGraph(request)
  })
}

export function bindWasmCompilerSession(session: CompilerWasmSession): BackendCompilerSession {
  return withLifecycle('wasm', {
    inspectCSS: (source) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      const result = reviveCompileResult(session.compileCSSDirectives<CompileCSSResult>(source, options))
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

export async function createCompilerBackendSession(): Promise<BackendCompilerSession> {
  const native = createNativeCompilerSession()
  if (native) return native
  return bindWasmCompilerSession(await createCompilerWasmSession())
}

export function createCompilerBackendSessionSync(): BackendCompilerSession {
  try {
    const compiler = createNativeCompilerSession()
    if (compiler) return compiler
  } catch (cause) {
    if (cause instanceof MasterCSSError && cause.domain === 'backend') {
      throw new MasterCSSError({
        code: 'NATIVE_UNAVAILABLE',
        domain: 'compiler',
        message: cause.message
      }, { cause })
    }
    throw cause
  }
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'compiler',
    message: 'Synchronous compiler creation requires the Master CSS native backend.'
  })
}
