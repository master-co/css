import { createWasmEngineLoader } from './index'
import { createWasmEngineProvider } from './provider-core'
import { loadRuntimeBindings, runtimeWasmURL } from './runtime-artifact'

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

const runtimeWasmEngine = createWasmEngineLoader({
  url: runtimeWasmURL,
  load: loadRuntimeBindings
})

export async function createMasterCSSEngineWasmProvider(
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  return await createWasmEngineProvider(runtimeWasmEngine, loadOptions)
}
