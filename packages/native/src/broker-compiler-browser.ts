import { MasterCSSError } from '@master/css-schema'
import { createMasterCSSCompilerWasmProvider } from '@master/css-wasm-compiler'
import { createCompilerWasmBackendSession } from './broker-compiler-wasm'
import type {
  MasterCSSBackendLoadOptions,
  MasterCSSCompilerBackendSession
} from './broker-compiler-contract'
import { callBackendAsync } from './normalize-error'

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
  MasterCSSBackendLoadOptions,
  MasterCSSCompilerBackendSession,
  MasterCSSCompilerRenderBackendSession,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './broker-compiler-contract'

export function createCompilerBackendSession(
  options: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSCompilerBackendSession> {
  if (options.backend === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'backend',
      message: 'Master CSS native compiler bindings are unavailable in browsers.'
    })
  }
  return callBackendAsync(
    'compiler',
    () => createCompilerWasmBackendSession(
      options.wasm,
      createMasterCSSCompilerWasmProvider
    )
  )
}
