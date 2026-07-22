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
  CompilerRenderSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => {
    nativeDeclarationCandidates(classNames: string[]): unknown
    ensureClasses(classNames: string[], nativeSupport?: boolean[]): void
    ensureStylesheetResources(nativeCSS: string): void
    emittedGlobals(): unknown
    snapshot(): unknown
    dispose(): void
    free(): void
  }
}

let modulePromise: Promise<GeneratedCompilerWasmModule> | undefined
const defaultWasmURL = new URL('../artifacts/mastercss_wasm_compiler_bg.wasm', import.meta.url)

export interface InitCompilerWasmOptions {
  module?: GeneratedCompilerWasmModule
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

async function importGeneratedModule(): Promise<GeneratedCompilerWasmModule> {
  return await import('../artifacts/mastercss_wasm_compiler.js') as unknown as GeneratedCompilerWasmModule
}

async function resolveWasmInput(
  input: InitCompilerWasmOptions['input']
): Promise<NonNullable<InitCompilerWasmOptions['input']>> {
  const resolvedInput = input || defaultWasmURL
  if (
    resolvedInput instanceof URL
    && resolvedInput.protocol === 'file:'
    && typeof process !== 'undefined'
    && process.versions?.node
  ) {
    const { readFile } = await import('node:fs/promises')
    return new Uint8Array(await readFile(resolvedInput))
  }
  return resolvedInput
}

export async function initCompilerWasm(options: InitCompilerWasmOptions = {}) {
  if (options.module) {
    await options.module.default({ module_or_path: await resolveWasmInput(options.input) })
    return options.module
  }
  modulePromise ??= importGeneratedModule().then(async (module) => {
    await module.default({ module_or_path: await resolveWasmInput(options.input) })
    return module
  })
  return await modulePromise
}

export async function createCompilerRenderSession(
  manifestJSON: string,
  emittedGlobalsJSON?: string,
  options: InitCompilerWasmOptions = {}
) {
  const module = await initCompilerWasm(options)
  const session = new module.CompilerRenderSession(manifestJSON, emittedGlobalsJSON)
  return {
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    ensureClasses: (classNames: string[], nativeSupport?: boolean[]) => session.ensureClasses(classNames, nativeSupport),
    ensureStylesheetResources: (nativeCSS: string) => session.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => session.emittedGlobals(),
    snapshot: () => session.snapshot(),
    dispose() {
      session.dispose()
      session.free()
    }
  }
}
