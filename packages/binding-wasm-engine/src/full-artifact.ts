import { createWasmEngineLoader } from './index'

// Hosts load the module with every feature: Node reads it from disk, other hosts
// fetch it. Browsers execute programs with the JavaScript engine instead.
export const fullWasmEngine = createWasmEngineLoader({
  url: new URL('../artifacts/mastercss_binding_wasm_engine_bg.wasm', import.meta.url),
  load: () => import('../artifacts/mastercss_binding_wasm_engine.js')
})
