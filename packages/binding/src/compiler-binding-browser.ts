import { MasterCSSError } from '@master/css-schema'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import { createMasterCSSCompilerWasmProvider } from '@master/css-binding-wasm-compiler'
import {
  createCompilerWasmBindingSession,
  createCompilerWasmRenderBindingSession
} from './compiler-binding-wasm'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSCompilerBindingSession,
  MasterCSSCompilerRenderBindingSession,
  MasterCSSCompilerRenderBindingSessionOptions
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
  MasterCSSCompilerRenderBindingSessionOptions,
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

export function createCompilerRenderBindingSession(
  options: MasterCSSCompilerRenderBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSCompilerRenderBindingSession> {
  if (loadOptions.binding === 'native') {
    throw new MasterCSSError({
      code: 'NATIVE_UNAVAILABLE',
      domain: 'binding',
      message: 'Master CSS native compiler bindings are unavailable in browsers.'
    })
  }
  return callBindingAsync(
    'compiler',
    () => createCompilerWasmRenderBindingSession(
      serializeMasterCSSManifest(options.manifest),
      options.emittedGlobals === undefined
        ? undefined
        : JSON.stringify(options.emittedGlobals),
      loadOptions.wasm,
      createMasterCSSCompilerWasmProvider
    )
  )
}
