import {
  createCompilerBackendSession as createBackendSession,
  type MasterCSSBackendLoadOptions,
  type MasterCSSCompileDefaultPresetRequest,
  type MasterCSSCompileManifestOptions,
  type MasterCSSCompilerBackendSession,
  type MasterCSSDirectiveCompileOptions,
  type MasterCSSDirectiveExtractionPolicy,
  type MasterCSSDirectiveManifestInput,
  type MasterCSSImportGraphRequest,
  type MasterCSSLowerDirectivesOptions,
  type MasterCSSLowerDirectivesRequest
} from '@master/css-backend/compiler'
import {
  createCompilerBackendSessionSync as createBackendSessionSync
} from '@master/css-backend/compiler/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'

export interface BackendCompilerSession {
  readonly backend: MasterCSSCompilerBackendSession['backend']
  inspectCSS: MasterCSSCompilerBackendSession['inspectCSS']
  compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult
  compileThemeCSS: MasterCSSCompilerBackendSession['compileThemeCSS']
  analyzeCSSDependencies: MasterCSSCompilerBackendSession['analyzeCSSDependencies']
  analyzeStandaloneDirectives: MasterCSSCompilerBackendSession['analyzeStandaloneDirectives']
  mergeCSSExtractionPolicies: MasterCSSCompilerBackendSession['mergeCSSExtractionPolicies']
  filterCSSExtractionCandidates: MasterCSSCompilerBackendSession['filterCSSExtractionCandidates']
  compileManifestInput: MasterCSSCompilerBackendSession['compileManifestInput']
  lowerCSSDirectives: MasterCSSCompilerBackendSession['lowerCSSDirectives']
  normalizeManifest: MasterCSSCompilerBackendSession['normalizeManifest']
  normalizeDefaultManifest: MasterCSSCompilerBackendSession['normalizeDefaultManifest']
  compileDefaultPresetManifest: MasterCSSCompilerBackendSession['compileDefaultPresetManifest']
  resolveCSSImportGraph: MasterCSSCompilerBackendSession['resolveCSSImportGraph']
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

function bindCompilerSession(session: MasterCSSCompilerBackendSession): BackendCompilerSession {
  return {
    backend: session.backend,
    inspectCSS: (source: string) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      return reviveCompileResult(session.compileCSSDirectives(source, {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      }) as CompileCSSResult)
    },
    compileThemeCSS: (source: string, options?: MasterCSSDirectiveCompileOptions) =>
      session.compileThemeCSS(source, options),
    analyzeCSSDependencies: (source: string) => session.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source: string) => session.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (
      policies: readonly Partial<MasterCSSDirectiveExtractionPolicy>[]
    ) => session.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (
      candidates: readonly string[],
      blocklist: Parameters<
        MasterCSSCompilerBackendSession['filterCSSExtractionCandidates']
      >[1]
    ) =>
      session.filterCSSExtractionCandidates(candidates, blocklist),
    compileManifestInput: (
      input: MasterCSSDirectiveManifestInput,
      options?: MasterCSSCompileManifestOptions
    ) => session.compileManifestInput(input, options),
    lowerCSSDirectives: (
      request: MasterCSSLowerDirectivesRequest,
      options?: MasterCSSLowerDirectivesOptions,
      sourceText?: string
    ) =>
      session.lowerCSSDirectives(request, options, sourceText),
    normalizeManifest: (manifest: MasterCSSManifest) => session.normalizeManifest(manifest),
    normalizeDefaultManifest: (manifest: MasterCSSManifest) =>
      session.normalizeDefaultManifest(manifest),
    compileDefaultPresetManifest: (request: MasterCSSCompileDefaultPresetRequest) =>
      session.compileDefaultPresetManifest(request),
    resolveCSSImportGraph: (request: MasterCSSImportGraphRequest) =>
      session.resolveCSSImportGraph(request),
    dispose: () => session.dispose()
  }
}

export async function createCompilerBackendSession(
  options: MasterCSSBackendLoadOptions = {}
): Promise<BackendCompilerSession> {
  return bindCompilerSession(await createBackendSession(options))
}

export function createCompilerBackendSessionSync(): BackendCompilerSession {
  return bindCompilerSession(createBackendSessionSync())
}
