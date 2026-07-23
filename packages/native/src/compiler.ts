import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type { MasterCSSNativeModuleOptions } from './engine-contract'

export interface MasterCSSNativeCompilerBackend {
  findManifestEntries(projectDir: string): readonly string[]
  loadProjectManifest(projectDir: string, baseManifest: unknown, entries?: readonly string[]): unknown
  loadPreparedProjectManifest(projectDir: string, baseManifest: unknown, graphs: unknown): unknown
  inspectCSS(source: string): unknown
  compileNativeCSS(source: string, options?: unknown): unknown
  compileCSSDirectives(source: string, options?: unknown): unknown
  compileThemeCSS(source: string, options?: unknown): unknown
  analyzeCSSDependencies(source: string): unknown
  analyzeStandaloneDirectives(source: string): unknown
  mergeCSSExtractionPolicies(policies: unknown): unknown
  filterCSSExtractionCandidates(candidates: readonly string[], blocklist: unknown): readonly string[]
  compileManifestInput(input: unknown, options?: unknown): unknown
  lowerCSSDirectives(request: unknown, options?: unknown): unknown
  normalizeManifest(manifest: unknown): unknown
  normalizeDefaultManifest(manifest: unknown): unknown
  compileDefaultPresetManifest(request: unknown): unknown
  resolveCSSImportGraph(request: unknown): unknown
  createInspectionReport(input: unknown): unknown
  renderClassNames(manifest: unknown, classNames: readonly string[], nativeSupport?: readonly boolean[]): unknown
}

function parse(value: string) {
  return JSON.parse(value) as unknown
}

function backendError(cause: unknown): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  const code = cause instanceof NativeBindingError ? cause.code : 'NATIVE_LOAD_FAILED'
  return new MasterCSSError({
    code,
    domain: 'backend',
    message: cause instanceof Error ? cause.message : String(cause)
  }, { cause })
}

export function loadNativeCompilerBackend(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeCompilerBackend | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const binding = loaded.binding
    const backend: MasterCSSNativeCompilerBackend = {
      findManifestEntries: (projectDir) => binding.findCssManifestEntries(projectDir),
      loadProjectManifest: (projectDir, baseManifest, entries) =>
        parse(binding.loadProjectManifestJson(
          projectDir,
          JSON.stringify(baseManifest),
          entries ? [...entries] : undefined
        )),
      loadPreparedProjectManifest: (projectDir, baseManifest, graphs) =>
        parse(binding.loadProjectManifestPreparedJson(
          projectDir,
          JSON.stringify(baseManifest),
          JSON.stringify(graphs)
        )),
      inspectCSS: (source) => parse(binding.inspectCssJson(source)),
      compileNativeCSS: (source, options) =>
        parse(binding.compileNativeCssJson(source, options === undefined ? undefined : JSON.stringify(options))),
      compileCSSDirectives: (source, options) =>
        parse(binding.compileCssDirectivesJson(source, options === undefined ? undefined : JSON.stringify(options))),
      compileThemeCSS: (source, options) =>
        parse(binding.compileThemeCssJson(source, options === undefined ? undefined : JSON.stringify(options))),
      analyzeCSSDependencies: (source) => parse(binding.analyzeCssDependenciesJson(source)),
      analyzeStandaloneDirectives: (source) => parse(binding.analyzeStandaloneDirectivesJson(source)),
      mergeCSSExtractionPolicies: (policies) =>
        parse(binding.mergeCssExtractionPoliciesJson(JSON.stringify(policies))),
      filterCSSExtractionCandidates: (candidates, blocklist) =>
        binding.filterCssExtractionCandidates([...candidates], JSON.stringify(blocklist)),
      compileManifestInput: (input, options) =>
        parse(binding.compileManifestInputJson(
          JSON.stringify(input),
          options === undefined ? undefined : JSON.stringify(options)
        )),
      lowerCSSDirectives: (request, options) =>
        parse(binding.lowerCssDirectivesJson(
          JSON.stringify(request),
          options === undefined ? undefined : JSON.stringify(options)
        )),
      normalizeManifest: (manifest) => parse(binding.normalizeManifestJson(JSON.stringify(manifest))),
      normalizeDefaultManifest: (manifest) =>
        parse(binding.normalizeDefaultManifestJson(JSON.stringify(manifest))),
      compileDefaultPresetManifest: (request) =>
        parse(binding.compileDefaultPresetManifestJson(JSON.stringify(request))),
      resolveCSSImportGraph: (request) =>
        parse(binding.resolveCssImportGraphJson(JSON.stringify(request))),
      createInspectionReport: (input) =>
        parse(binding.createInspectionReportJson(JSON.stringify(input))),
      renderClassNames: (manifest, classNames, nativeSupport) =>
        parse(binding.renderClassesJson(
          JSON.stringify(manifest),
          [...classNames],
          nativeSupport ? [...nativeSupport] : undefined
        ))
    }
    return Object.freeze(backend)
  } catch (cause) {
    throw backendError(cause)
  }
}

export {
  MASTER_CSS_DIAGNOSTICS_REPORT_VERSION,
  type MasterCSSCompileDefaultPresetRequestIR,
  type MasterCSSCompileDefaultPresetResultIR,
  type MasterCSSCompileManifestOptionsIR,
  type MasterCSSCompileManifestResultIR,
  type MasterCSSDiagnosticsReportInputIR,
  type MasterCSSDirectiveCompilationIR,
  type MasterCSSDirectiveExtractionPolicyIR,
  type MasterCSSDirectiveManifestInputIR,
  type MasterCSSDirectiveVariableDefinitionIR,
  type MasterCSSDiscoveredClassesIR,
  type MasterCSSImportGraphEdgeIR,
  type MasterCSSImportGraphRequestIR,
  type MasterCSSInspectionDiagnosticDataIR,
  type MasterCSSInspectionDiagnosticIR,
  type MasterCSSInspectionDiagnosticCode,
  type MasterCSSInspectionDiagnosticSeverity,
  type MasterCSSInspectionDiagnosticSourceKind,
  type MasterCSSInspectionReportIR,
  type MasterCSSMissingCSSReason,
  type MasterCSSMissingCSSResultIR,
  type MasterCSSMissingCSSStatus,
  type MasterCSSNativeDeclarationCandidateIR,
  type MasterCSSRegexIR,
  type MasterCSSResolvedImportGraphIR,
  type MasterCSSServerRenderIR,
  type MasterCSSSourceInspectionIR,
  type MasterCSSStylesheetErrorIR,
  type MasterCSSStylesheetInspectionIR
} from './protocol'
