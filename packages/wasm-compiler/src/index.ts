interface GeneratedCompilerWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  bindingInfo(): unknown
  inspectCSS(source: string): unknown
  compileNativeCSS(source: string, options?: unknown): unknown
  compileCSSDirectives(source: string, options?: unknown): unknown
  compileThemeCSS(source: string, options?: unknown): unknown
  compileManifestInput(input: unknown, options?: unknown): unknown
  normalizeManifestForJSON(manifest: unknown): unknown
  normalizeDefaultManifestForJSON(manifest: unknown): unknown
  compileDefaultPresetManifest(request: unknown): unknown
  resolveCSSImportGraph(request: unknown): unknown
}

let modulePromise: Promise<GeneratedCompilerWasmModule> | undefined
const defaultWasmURL = new URL('../artifacts/mastercss_wasm_compiler_bg.wasm', import.meta.url)

export interface InitCompilerWasmOptions {
  module?: GeneratedCompilerWasmModule
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

async function importGeneratedModule(): Promise<GeneratedCompilerWasmModule> {
  const specifier = '../artifacts/mastercss_wasm_compiler.js'
  return await import(specifier) as GeneratedCompilerWasmModule
}

export async function initCompilerWasm(options: InitCompilerWasmOptions = {}) {
  if (options.module) {
    await options.module.default({ module_or_path: options.input || defaultWasmURL })
    return options.module
  }
  modulePromise ??= importGeneratedModule().then(async (module) => {
    await module.default({ module_or_path: options.input || defaultWasmURL })
    return module
  })
  return await modulePromise
}
