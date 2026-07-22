import type {
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineTransitionIR
} from '@master/css-schema'

interface GeneratedWasmSession {
  manifestJSON(): string
  ensureClassRules(classNames: string[]): MasterCSSEngineTransitionIR
  deleteClassRules(classNames: string[]): MasterCSSEngineTransitionIR
  nativeDeclarationCandidates(classNames: string[]): MasterCSSNativeDeclarationCandidateIR[]
  ensureClassRulesWithNativeSupport(classNames: string[], supported: Uint8Array): MasterCSSEngineTransitionIR
  refresh(manifestJSON: string): MasterCSSEngineTransitionIR
  snapshot(): MasterCSSEngineSnapshotIR
  inspect(className: string): import('@master/css-schema').MasterCSSEngineInspectionIR
  dispose(): void
}

interface GeneratedWasmModule {
  default(input: {
    module_or_path: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  }): Promise<WebAssembly.Exports>
  EngineSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => GeneratedWasmSession
  bindingInfo(): unknown
}

let modulePromise: Promise<GeneratedWasmModule> | undefined
const defaultWasmURL = new URL('../artifacts/mastercss_wasm_runtime_bg.wasm', import.meta.url)

export interface InitRuntimeWasmOptions {
  module?: GeneratedWasmModule
  input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module
  emittedGlobalsJSON?: string
}

async function importGeneratedModule(): Promise<GeneratedWasmModule> {
  return await import('../artifacts/mastercss_wasm_runtime.js') as unknown as GeneratedWasmModule
}

export async function initRuntimeWasm(options: InitRuntimeWasmOptions = {}) {
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

export async function createRuntimeWasmSession(
  manifestJSON: string,
  options: InitRuntimeWasmOptions = {}
) {
  const module = await initRuntimeWasm(options)
  const session = new module.EngineSession(manifestJSON, options.emittedGlobalsJSON)
  return {
    manifestJSON: () => session.manifestJSON(),
    ensureClassRules(classNames: string[]) {
      const candidates = session.nativeDeclarationCandidates(classNames)
      if (!candidates.length) return session.ensureClassRules(classNames)
      const supported = Uint8Array.from(candidates, ({ property, value }) => {
        try {
          return globalThis.CSS?.supports(property, value) === true ? 1 : 0
        } catch {
          return 0
        }
      })
      return session.ensureClassRulesWithNativeSupport(classNames, supported)
    },
    deleteClassRules: (classNames: string[]) => session.deleteClassRules(classNames),
    refresh: (nextManifestJSON: string) => session.refresh(nextManifestJSON),
    snapshot: () => session.snapshot(),
    inspect: (className: string) => session.inspect(className),
    dispose: () => session.dispose()
  }
}
