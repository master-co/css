import { wasmEngine } from './artifact'
import { createWasmEngineProvider } from './provider-core'

export type MasterCSSWasmEngineInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface MasterCSSWasmEngineLoadOptions {
  readonly module?: object
  readonly input?: MasterCSSWasmEngineInput
}

export async function createMasterCSSEngineWasmProvider(
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  return await createWasmEngineProvider(wasmEngine, loadOptions)
}
