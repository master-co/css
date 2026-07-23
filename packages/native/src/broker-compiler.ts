import { bindCompilerBackendSession } from './broker-compiler-adapter'
import { createCompilerWasmBackendSession } from './broker-compiler-wasm'
import type {
  MasterCSSBackendLoadOptions,
  MasterCSSCompilerBackendSession
} from './broker-compiler-contract'
import { normalizeBackendError } from './normalize-error'
import { shouldLoadMasterCSSNativeBackend } from './backend-options'

async function loadNativeCompilerFactory() {
  const nodeCompilerModule = import.meta.url.endsWith('.ts') ? './compiler.ts' : './compiler.js'
  return await import(/* @vite-ignore */ nodeCompilerModule) as typeof import('./compiler')
}

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

export async function createCompilerBackendSession(
  options: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSCompilerBackendSession> {
  try {
    if (shouldLoadMasterCSSNativeBackend(options.backend)) {
      const { loadNativeCompilerBackend } = await loadNativeCompilerFactory()
      const native = loadNativeCompilerBackend({
        ...options.native,
        required: options.backend === 'native'
      })
      if (native) {
        return bindCompilerBackendSession('native', {
          ...native,
          dispose: () => undefined
        })
      }
    }
    return await createCompilerWasmBackendSession(options.wasm)
  } catch (cause) {
    throw normalizeBackendError(cause, 'compiler')
  }
}
