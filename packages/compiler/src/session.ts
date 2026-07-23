import {
  createCompilerBackendSession as createBackendSession,
  type MasterCSSBackendLoadOptions,
  type MasterCSSCompilerBackendSession
} from '@master/css-backend/compiler'
import {
  createCompilerBackendSessionSync as createBackendSessionSync
} from '@master/css-backend/compiler/node'
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
    inspectCSS: (source) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      return reviveCompileResult(session.compileCSSDirectives(source, {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      }) as CompileCSSResult)
    },
    compileThemeCSS: (source, options) => session.compileThemeCSS(source, options),
    analyzeCSSDependencies: (source) => session.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source) => session.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (policies) => session.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (candidates, blocklist) =>
      session.filterCSSExtractionCandidates(candidates, blocklist),
    compileManifestInput: (input, options) => session.compileManifestInput(input, options),
    lowerCSSDirectives: (request, options, sourceText) =>
      session.lowerCSSDirectives(request, options, sourceText),
    normalizeManifest: (manifest) => session.normalizeManifest(manifest),
    normalizeDefaultManifest: (manifest) => session.normalizeDefaultManifest(manifest),
    compileDefaultPresetManifest: (request) => session.compileDefaultPresetManifest(request),
    resolveCSSImportGraph: (request) => session.resolveCSSImportGraph(request),
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
