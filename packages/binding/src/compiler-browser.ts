import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import type { MasterCSSNativeCompilerBinding } from './compiler'

export type {
  MasterCSSNativeCompilerBinding
} from './compiler'
export type { MasterCSSNativeModuleOptions } from './engine-contract'
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

export function loadNativeCompilerBinding(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeCompilerBinding | undefined {
  if (!moduleOptions.required) return
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'binding',
    message: 'Master CSS native compiler bindings are unavailable in browsers.'
  })
}
