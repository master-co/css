import { MasterCSSError } from '@master/css-schema'
import type { MasterCSSNativeModuleOptions } from './engine-contract'
import type { MasterCSSNativeCompilerBackend } from './compiler'

export type {
  MasterCSSNativeCompilerBackend
} from './compiler'
export type { MasterCSSNativeModuleOptions } from './engine-contract'
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

export function loadNativeCompilerBackend(
  moduleOptions: MasterCSSNativeModuleOptions = {}
): MasterCSSNativeCompilerBackend | undefined {
  if (!moduleOptions.required) return
  throw new MasterCSSError({
    code: 'NATIVE_UNAVAILABLE',
    domain: 'backend',
    message: 'Master CSS native compiler bindings are unavailable in browsers.'
  })
}
