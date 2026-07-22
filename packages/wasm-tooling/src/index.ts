interface GeneratedToolingWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  bindingInfo(): unknown
  extractClassCandidates(content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  extractHTMLClasses(source: string, content: string): string[]
  extractAstroClasses(source: string, content: string): string[]
  createInspectionReport(input: unknown): unknown
  ToolingScannerSession: new (manifestJSON: string) => {
    scan(source: string, content: string): unknown
    nativeDeclarationCandidates(candidates: string[]): unknown
    collectCandidates(candidates: string[]): string[]
    scanCandidates(
      source: string,
      content: string,
      candidates: string[],
      excludedClasses: string[],
      nativeSupport: boolean[],
      invalidGeneratedClasses: string[]
    ): unknown
    ensureClasses(classNames: string[]): unknown
    registerNativeClasses(classNames: string[]): boolean
    reset(): void
    state(): unknown
    dispose(): void
    free(): void
  }
  ToolingValidatorSession: new (manifestJSON: string) => {
    nativeDeclarationCandidates(classNames: string[]): unknown
    generateClasses(classNames: string[], nativeSupport?: boolean[]): unknown
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

export async function createToolingScannerSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingScannerSession(manifestJSON)
  return {
    scan: (source: string, content: string) => session.scan(source, content),
    nativeDeclarationCandidates: (candidates: string[]) => session.nativeDeclarationCandidates(candidates),
    collectCandidates: (candidates: string[]) => session.collectCandidates(candidates),
    scanCandidates: (
      source: string,
      content: string,
      candidates: string[],
      excludedClasses: string[],
      nativeSupport: boolean[],
      invalidGeneratedClasses: string[]
    ) => session.scanCandidates(source, content, candidates, excludedClasses, nativeSupport, invalidGeneratedClasses),
    ensureClasses: (classNames: string[]) => session.ensureClasses(classNames),
    registerNativeClasses: (classNames: string[]) => session.registerNativeClasses(classNames),
    reset: () => session.reset(),
    state: () => session.state(),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}

export async function createToolingValidatorSession(
  manifestJSON: string,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  const session = new module.ToolingValidatorSession(manifestJSON)
  return {
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    generateClasses: (classNames: string[], nativeSupport?: boolean[]) => session.generateClasses(classNames, nativeSupport),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}

export async function createToolingInspectionReport(
  input: unknown,
  options: InitToolingWasmOptions = {}
) {
  const module = await initToolingWasm(options)
  return module.createInspectionReport(input)
}
