import {
  createCompilerBindingSession as createBindingSession,
  type MasterCSSBindingLoadOptions,
  type MasterCSSCompileDefaultPresetRequest,
  type MasterCSSCompileManifestOptions,
  type MasterCSSCompilerBindingSession,
  type MasterCSSDirectiveCompileOptions,
  type MasterCSSDirectiveExtractionPolicy,
  type MasterCSSDirectiveManifestInput,
  type MasterCSSImportGraphRequest,
  type MasterCSSLowerDirectivesOptions,
  type MasterCSSLowerDirectivesRequest
} from '@master/css-binding/compiler'
import {
  type MasterCSSManifest
} from '@master/css-schema/manifest'
import type { CompileCSSOptions, CompileCSSResult } from './contracts'

export interface BindingCompilerSession {
  readonly binding: MasterCSSCompilerBindingSession['binding']
  inspectCSS: MasterCSSCompilerBindingSession['inspectCSS']
  compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult
  analyzeCSSDependencies: MasterCSSCompilerBindingSession['analyzeCSSDependencies']
  analyzeStandaloneDirectives: MasterCSSCompilerBindingSession['analyzeStandaloneDirectives']
  mergeCSSExtractionPolicies: MasterCSSCompilerBindingSession['mergeCSSExtractionPolicies']
  filterCSSExtractionCandidates: MasterCSSCompilerBindingSession['filterCSSExtractionCandidates']
  compileManifestInput: MasterCSSCompilerBindingSession['compileManifestInput']
  lowerCSSDirectives: MasterCSSCompilerBindingSession['lowerCSSDirectives']
  normalizeManifest: MasterCSSCompilerBindingSession['normalizeManifest']
  normalizeDefaultManifest: MasterCSSCompilerBindingSession['normalizeDefaultManifest']
  compileDefaultPresetManifest: MasterCSSCompilerBindingSession['compileDefaultPresetManifest']
  resolveCSSImportGraph: MasterCSSCompilerBindingSession['resolveCSSImportGraph']
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

function bindCompilerSession(session: MasterCSSCompilerBindingSession): BindingCompilerSession {
  return {
    binding: session.binding,
    inspectCSS: (source: string) => session.inspectCSS(source),
    compileCSS(source, options = {}) {
      return reviveCompileResult(session.compileCSSDirectives(source, {
        from: options.from || 'master.css',
        preserveNativeCSS: options.preserveNativeCSS !== false,
        ...(options.classes ? { classes: options.classes } : {})
      }) as CompileCSSResult)
    },
    analyzeCSSDependencies: (source: string) => session.analyzeCSSDependencies(source),
    analyzeStandaloneDirectives: (source: string) => session.analyzeStandaloneDirectives(source),
    mergeCSSExtractionPolicies: (
      policies: readonly Partial<MasterCSSDirectiveExtractionPolicy>[]
    ) => session.mergeCSSExtractionPolicies(policies),
    filterCSSExtractionCandidates: (
      candidates: readonly string[],
      blocklist: Parameters<
        MasterCSSCompilerBindingSession['filterCSSExtractionCandidates']
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

export async function createCompilerBindingSession(
  options: MasterCSSBindingLoadOptions = {}
): Promise<BindingCompilerSession> {
  return bindCompilerSession(await createBindingSession(options))
}

/** @internal */
export function bindCompilerBindingSessionInternal(
  session: MasterCSSCompilerBindingSession
): BindingCompilerSession {
  return bindCompilerSession(session)
}
