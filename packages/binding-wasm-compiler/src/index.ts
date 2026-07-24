import { MasterCSSError } from '@master/css-schema'

interface GeneratedCompilerWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  bindingInfo(): unknown
  inspectCSS(source: string): unknown
  compileNativeCSS(source: string, options?: unknown): unknown
  compileCSSDirectives(source: string, options?: unknown): unknown
  compileThemeCSS(source: string, options?: unknown): unknown
  analyzeCSSDependencies(source: string): unknown
  analyzeStandaloneDirectives(source: string): unknown
  mergeCSSExtractionPolicies(policies: unknown): unknown
  filterCSSExtractionCandidates(candidates: string[], blocklist: unknown): string[]
  compileManifestInput(input: unknown, options?: unknown): unknown
  lowerCSSDirectives(request: unknown, options?: unknown): unknown
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
const initializedInputs = new WeakMap<object, NonNullable<InitCompilerWasmOptions['input']>>()
const defaultWasmURL = new URL('../artifacts/mastercss_binding_wasm_compiler_bg.wasm', import.meta.url)

export interface InitCompilerWasmOptions {
  module?: object
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
}

async function importGeneratedModule(): Promise<GeneratedCompilerWasmModule> {
  return await import('../artifacts/mastercss_binding_wasm_compiler.js') as unknown as GeneratedCompilerWasmModule
}

async function resolveWasmInput(
  input: InitCompilerWasmOptions['input']
): Promise<NonNullable<InitCompilerWasmOptions['input']>> {
  return input || defaultWasmURL
}

function sameInput(
  left: NonNullable<InitCompilerWasmOptions['input']>,
  right: NonNullable<InitCompilerWasmOptions['input']>
) {
  return left === right || String(left) === String(right)
}

async function initializeModule(
  module: GeneratedCompilerWasmModule,
  input: NonNullable<InitCompilerWasmOptions['input']>
) {
  const initializedInput = initializedInputs.get(module)
  if (initializedInput !== undefined) {
    if (!sameInput(initializedInput, input)) {
      throw new MasterCSSError({
        code: 'WASM_INPUT_CONFLICT',
        domain: 'binding',
        message: 'A Master CSS compiler Wasm module cannot be initialized with two different inputs.'
      })
    }
    return module
  }
  await module.default({ module_or_path: input })
  initializedInputs.set(module, input)
  compilerBindingInfo(module)
  return module
}

export async function initCompilerWasm(options: InitCompilerWasmOptions = {}) {
  try {
    if (options.module) {
      const module = options.module as GeneratedCompilerWasmModule
      return await initializeModule(module, await resolveWasmInput(options.input))
    }
    if (options.input !== undefined) {
      return await initializeModule(
        await importGeneratedModule(),
        await resolveWasmInput(options.input)
      )
    }
    modulePromise ??= importGeneratedModule()
      .then(async (module) =>
        initializeModule(module, await resolveWasmInput(defaultWasmURL))
      )
      .catch((cause) => {
        modulePromise = undefined
        throw cause
      })
    return await modulePromise
  } catch (cause) {
    if (cause instanceof MasterCSSError) throw cause
    throw new MasterCSSError({
      code: 'WASM_LOAD_FAILED',
      domain: 'binding',
      message: cause instanceof Error
        ? cause.message
        : 'Cannot load the Master CSS compiler Wasm artifact.'
    }, { cause })
  }
}

function compilerBindingInfo(module: GeneratedCompilerWasmModule) {
  return module.bindingInfo()
}

export interface CompilerWasmSession {
  readonly info: unknown
  inspectCSS<T = unknown>(source: string): T
  compileNativeCSS<T = unknown>(source: string, options?: unknown): T
  compileCSSDirectives<T = unknown>(source: string, options?: unknown): T
  compileThemeCSS<T = unknown>(source: string, options?: unknown): T
  analyzeCSSDependencies<T = unknown>(source: string): T
  analyzeStandaloneDirectives<T = unknown>(source: string): T
  mergeCSSExtractionPolicies<T = unknown>(policies: unknown): T
  filterCSSExtractionCandidates(candidates: string[], blocklist: unknown): string[]
  compileManifestInput<T = unknown>(input: unknown, options?: unknown): T
  lowerCSSDirectives<T = unknown>(request: unknown, options?: unknown): T
  normalizeManifestForJSON<T = unknown>(manifest: unknown): T
  normalizeDefaultManifestForJSON<T = unknown>(manifest: unknown): T
  compileDefaultPresetManifest<T = unknown>(request: unknown): T
  resolveCSSImportGraph<T = unknown>(request: unknown): T
}

export async function createCompilerWasmSession(
  options: InitCompilerWasmOptions = {}
): Promise<CompilerWasmSession> {
  const module = await initCompilerWasm(options)
  return {
    info: compilerBindingInfo(module),
    inspectCSS: <T>(source: string) => module.inspectCSS(source) as T,
    compileNativeCSS: <T>(source: string, compileOptions?: unknown) => module.compileNativeCSS(source, compileOptions) as T,
    compileCSSDirectives: <T>(source: string, compileOptions?: unknown) => module.compileCSSDirectives(source, compileOptions) as T,
    compileThemeCSS: <T>(source: string, compileOptions?: unknown) => module.compileThemeCSS(source, compileOptions) as T,
    analyzeCSSDependencies: <T>(source: string) => module.analyzeCSSDependencies(source) as T,
    analyzeStandaloneDirectives: <T>(source: string) => module.analyzeStandaloneDirectives(source) as T,
    mergeCSSExtractionPolicies: <T>(policies: unknown) => module.mergeCSSExtractionPolicies(policies) as T,
    filterCSSExtractionCandidates: (candidates: string[], blocklist: unknown) =>
      module.filterCSSExtractionCandidates(candidates, blocklist),
    compileManifestInput: <T>(input: unknown, compileOptions?: unknown) => module.compileManifestInput(input, compileOptions) as T,
    lowerCSSDirectives: <T>(request: unknown, compileOptions?: unknown) => module.lowerCSSDirectives(request, compileOptions) as T,
    normalizeManifestForJSON: <T>(manifest: unknown) => module.normalizeManifestForJSON(manifest) as T,
    normalizeDefaultManifestForJSON: <T>(manifest: unknown) => module.normalizeDefaultManifestForJSON(manifest) as T,
    compileDefaultPresetManifest: <T>(request: unknown) => module.compileDefaultPresetManifest(request) as T,
    resolveCSSImportGraph: <T>(request: unknown) => module.resolveCSSImportGraph(request) as T
  }
}

export async function createCompilerRenderSession(
  manifestJSON: string,
  emittedGlobalsJSON?: string,
  options: InitCompilerWasmOptions = {}
) {
  const module = await initCompilerWasm(options)
  const session = new module.CompilerRenderSession(manifestJSON, emittedGlobalsJSON)
  let disposed = false
  return {
    nativeDeclarationCandidates: (classNames: string[]) => session.nativeDeclarationCandidates(classNames),
    ensureClasses: (classNames: string[], nativeSupport?: boolean[]) => session.ensureClasses(classNames, nativeSupport),
    ensureStylesheetResources: (nativeCSS: string) => session.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => session.emittedGlobals(),
    snapshot: () => session.snapshot(),
    dispose() {
      if (disposed) return
      disposed = true
      session.dispose()
      session.free()
    }
  }
}
