interface GeneratedToolingWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  bindingInfo(): unknown
  extractClassCandidates(content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  extractHTMLClasses(source: string, content: string): string[]
  extractAstroClasses(source: string, content: string): string[]
  ToolingScannerSession: new (manifestJSON: string) => {
    scan(source: string, content: string): unknown
    reset(): void
    state(): unknown
    dispose(): void
    free(): void
  }
}

let modulePromise: Promise<GeneratedToolingWasmModule> | undefined
const defaultWasmURL = new URL('../artifacts/mastercss_wasm_tooling_bg.wasm', import.meta.url)

export interface InitToolingWasmOptions {
  module?: GeneratedToolingWasmModule
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

async function importGeneratedModule(): Promise<GeneratedToolingWasmModule> {
  const specifier = '../artifacts/mastercss_wasm_tooling.js'
  return await import(specifier) as GeneratedToolingWasmModule
}

export async function initToolingWasm(options: InitToolingWasmOptions = {}) {
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
