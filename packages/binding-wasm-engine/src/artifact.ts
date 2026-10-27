import { createWasmEngineLoader } from './index'

// Node reads the module from disk and other hosts fetch it. Browsers execute
// programs with the JavaScript engine instead.
export const wasmEngine = createWasmEngineLoader({
  url: new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url),
  load: () => import('../artifacts/mastercss_binding_wasm_engine.js')
})
