import { loadNativeCompilerBinding } from './compiler'
import { bindCompilerBindingSession } from './compiler-binding-adapter'
import type {
  MasterCSSCompilerBindingSession,
  MasterCSSNativeBindingLoadOptions
} from './compiler-binding-contract'
import { normalizeBindingError } from './normalize-error'

export { MASTER_CSS_DIAGNOSTICS_REPORT_VERSION } from './protocol'
export type {
  MasterCSSCompileDefaultPresetRequest,
  MasterCSSCompileDefaultPresetResult,
  MasterCSSCompileManifestOptions,
  MasterCSSCompileManifestResult,
  MasterCSSCompilerInspection,
  MasterCSSDependencyAnalysis,
  MasterCSSDiagnosticsReportInput,
  MasterCSSDirectiveCompilation,
  MasterCSSDirectiveCompileOptions,
  MasterCSSDirectiveExtractionPolicy,
  MasterCSSDirectiveManifestInput,
  MasterCSSImportGraphRequest,
  MasterCSSInspectionReport,
  MasterCSSLowerDirectivesOptions,
  MasterCSSLowerDirectivesRequest,
  MasterCSSLowerDirectivesResult,
  MasterCSSProjectEntryGraph,
  MasterCSSProjectManifest,
  MasterCSSResolvedImportGraph,
  MasterCSSStandaloneDirectiveAnalysis
} from './protocol'
export type {
  MasterCSSCompilerBindingSession,
  MasterCSSNativeBindingLoadOptions
} from './compiler-binding-contract'

export function createCompilerBindingSessionSync(
  options: MasterCSSNativeBindingLoadOptions = {}
): MasterCSSCompilerBindingSession {
  try {
    const native = loadNativeCompilerBinding({ ...options, required: true })!
    return bindCompilerBindingSession('native', {
      ...native,
      dispose: () => undefined
    })
  } catch (cause) {
    throw normalizeBindingError(cause, 'compiler')
  }
}
