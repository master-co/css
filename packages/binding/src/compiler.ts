import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSCompilerBindingSession } from './compiler-binding-contract'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import { NativeBindingError } from './errors'
import { loadNativeBinding } from './native-loader'

export type { MasterCSSNativeModuleOptions } from './engine-contract'

export type MasterCSSNativeCompilerBinding = Omit<
  MasterCSSCompilerBindingSession,
  'binding' | 'dispose' | typeof Symbol.dispose
>

function parse<T>(value: string): T {
  return JSON.parse(value) as T
}

function bindingError(cause: unknown): MasterCSSError {
  if (cause instanceof MasterCSSError) return cause
  const code = cause instanceof NativeBindingError ? cause.code : 'NATIVE_LOAD_FAILED'
  return new MasterCSSError({
    code,
    domain: 'binding',
    message: cause instanceof Error ? cause.message : String(cause)
  }, { cause })
}

export function loadNativeCompilerBinding(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeCompilerBinding | undefined {
  try {
    const loaded = loadNativeBinding(moduleOptions)
    if (!loaded) return
    const nativeBinding = loaded.binding
    const compilerBinding: MasterCSSNativeCompilerBinding = {
      findManifestEntries: (projectDir) => nativeBinding.findCssManifestEntries(projectDir),
      loadProjectManifest: (projectDir, baseManifest, entries) =>
        parse(nativeBinding.loadProjectManifestJson(
          projectDir,
          JSON.stringify(baseManifest),
          entries ? [...entries] : undefined
        )),
      loadPreparedProjectManifest: (projectDir, baseManifest, graphs) =>
        parse(nativeBinding.loadProjectManifestPreparedJson(
          projectDir,
          JSON.stringify(baseManifest),
          JSON.stringify(graphs)
        )),
      inspectCSS: (source) => parse(nativeBinding.inspectCssJson(source)),
      compileNativeCSS: (source, options) =>
        parse(nativeBinding.compileNativeCssJson(source, options === undefined ? undefined : JSON.stringify(options))),
      compileCSSDirectives: (source, options) =>
        parse(nativeBinding.compileCssDirectivesJson(source, options === undefined ? undefined : JSON.stringify(options))),
      analyzeCSSDependencies: (source) => parse(nativeBinding.analyzeCssDependenciesJson(source)),
      analyzeStandaloneDirectives: (source) => parse(nativeBinding.analyzeStandaloneDirectivesJson(source)),
      mergeCSSExtractionPolicies: (policies) =>
        parse(nativeBinding.mergeCssExtractionPoliciesJson(JSON.stringify(policies))),
      filterCSSExtractionCandidates: (candidates, blocklist) =>
        nativeBinding.filterCssExtractionCandidates([...candidates], JSON.stringify(blocklist)),
      compileManifestInput: (input, options) =>
        parse(nativeBinding.compileManifestInputJson(
          JSON.stringify(input),
          options === undefined ? undefined : JSON.stringify(options)
        )),
      lowerCSSDirectives: (request, options) =>
        parse(nativeBinding.lowerCssDirectivesJson(
          JSON.stringify(request),
          options === undefined ? undefined : JSON.stringify(options)
        )),
      normalizeManifest: (manifest) => parse(nativeBinding.normalizeManifestJson(JSON.stringify(manifest))),
      normalizeDefaultManifest: (manifest) =>
        parse(nativeBinding.normalizeDefaultManifestJson(JSON.stringify(manifest))),
      compileDefaultPresetManifest: (request) =>
        parse(nativeBinding.compileDefaultPresetManifestJson(JSON.stringify(request))),
      resolveCSSImportGraph: (request) =>
        parse(nativeBinding.resolveCssImportGraphJson(JSON.stringify(request))),
      createInspectionReport: (input) =>
        parse(nativeBinding.createInspectionReportJson(JSON.stringify(input))),
      renderClassNames: (manifest, classNames, nativeSupport) =>
        parse(nativeBinding.renderClassesJson(
          JSON.stringify(manifest),
          [...classNames],
          nativeSupport ? [...nativeSupport] : undefined
        ))
    }
    return Object.freeze(compilerBinding)
  } catch (cause) {
    throw bindingError(cause)
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
