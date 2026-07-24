import { MasterCSSError } from '@master/css-schema'
import { createMasterCSSCompilerWasmProvider } from '@master/css-binding-wasm-compiler'
import { createCompilerWasmBindingSession } from './compiler-binding-wasm'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSCompilerBindingSession
} from './compiler-binding-contract'
import { callBindingAsync } from './normalize-error'

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
  MasterCSSBindingLoadOptions,
  MasterCSSCompilerBindingSession,
  MasterCSSCompilerRenderBindingSession,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './compiler-binding-contract'

export function createCompilerBindingSession(
  options: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSCompilerBindingSession> {
  if (options.binding === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native compiler bindings are unavailable in browsers.'
    })
  }
  return callBindingAsync(
    'compiler',
    () => createCompilerWasmBindingSession(
      options.wasm,
      createMasterCSSCompilerWasmProvider
    )
  )
}
