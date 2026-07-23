import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSCompilerBackendSession } from './broker-compiler-contract'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type { MasterCSSNativeModuleOptions } from './engine-contract'

export type MasterCSSNativeCompilerBackend = Omit<
  MasterCSSCompilerBackendSession,
  'backend' | 'dispose' | typeof Symbol.dispose
>

function parse<T>(value: string): T {
  return JSON.parse(value) as T
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
  type MasterCSSCompileDefaultPresetRequest,
  type MasterCSSCompileDefaultPresetResult,
  type MasterCSSCompileManifestOptions,
  type MasterCSSCompileManifestResult,
  type MasterCSSDiagnosticsReportInput,
  type MasterCSSDirectiveCompilation,
  type MasterCSSDirectiveExtractionPolicy,
  type MasterCSSDirectiveManifestInput,
  type MasterCSSDirectiveVariableDefinition,
  type MasterCSSDiscoveredClasses,
  type MasterCSSImportGraphEdge,
  type MasterCSSImportGraphRequest,
  type MasterCSSInspectionDiagnosticData,
  type MasterCSSInspectionDiagnostic,
  type MasterCSSInspectionDiagnosticCode,
  type MasterCSSInspectionDiagnosticSeverity,
  type MasterCSSInspectionDiagnosticSourceKind,
  type MasterCSSInspectionReport,
  type MasterCSSMissingCSSReason,
  type MasterCSSMissingCSSResult,
  type MasterCSSMissingCSSStatus,
  type MasterCSSNativeDeclarationCandidate,
  type MasterCSSRegex,
  type MasterCSSResolvedImportGraph,
  type MasterCSSServerRender,
  type MasterCSSSourceInspection,
  type MasterCSSStylesheetError,
  type MasterCSSStylesheetInspection
} from './protocol'
