import { bindCompilerBindingSession } from './compiler-binding-adapter'
import { createCompilerWasmBindingSession } from './compiler-binding-wasm'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSCompilerBindingSession
} from './compiler-binding-contract'
import { normalizeBindingError } from './normalize-error'
import { shouldLoadMasterCSSNativeBinding } from './binding-options'

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
  MasterCSSBindingLoadOptions,
  MasterCSSCompilerBindingSession,
  MasterCSSCompilerRenderBindingSession,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './compiler-binding-contract'

export async function createCompilerBindingSession(
  options: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSCompilerBindingSession> {
  try {
    if (shouldLoadMasterCSSNativeBinding(options.binding)) {
      const { loadNativeCompilerBinding } = await loadNativeCompilerFactory()
      const native = loadNativeCompilerBinding({
        ...options.native,
        required: options.binding === 'native'
      })
      if (native) {
        return bindCompilerBindingSession('native', {
          ...native,
          dispose: () => undefined
        })
      }
    }
    return await createCompilerWasmBindingSession(options.wasm)
  } catch (cause) {
    throw normalizeBindingError(cause, 'compiler')
  }
}
