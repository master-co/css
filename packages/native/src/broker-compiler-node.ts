import { loadNativeCompilerBackend } from './compiler'
import { bindCompilerBackendSession } from './broker-compiler-adapter'
import type {
  MasterCSSCompilerBackendSession,
  MasterCSSNativeBackendLoadOptions
} from './broker-compiler-contract'
import { normalizeBackendError } from './normalize-error'

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
  MasterCSSCompilerBackendSession,
  MasterCSSNativeBackendLoadOptions
} from './broker-compiler-contract'

export function createCompilerBackendSessionSync(
  options: MasterCSSNativeBackendLoadOptions = {}
): MasterCSSCompilerBackendSession {
  try {
    const native = loadNativeCompilerBackend({ ...options, required: true })!
    return bindCompilerBackendSession('native', {
      ...native,
      dispose: () => undefined
    })
  } catch (cause) {
    throw normalizeBackendError(cause, 'compiler')
  }
}
