// Browsers execute only engine sessions, so they load the module built without
// render sessions and inspection; `cargo xtask build-wasm runtime` stages it here.
// The runtime's CDN bundle replaces this module to load the Wasm beside its script.
export const runtimeWasmURL = new URL('../artifacts/runtime/mastercss_binding_wasm_engine_bg.wasm', import.meta.url)

export function loadRuntimeBindings(): Promise<object> {
  return import('../artifacts/runtime/mastercss_binding_wasm_engine.js')
}
