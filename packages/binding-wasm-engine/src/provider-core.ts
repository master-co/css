import type { MasterCSSWasmEngineLoader } from './index'
import type { MasterCSSWasmEngineLoadOptions } from './provider'

interface MasterCSSWasmEngineProviderSession {
  manifestJSON(): string
  ensureClassRules(classNames: string[]): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  deleteClassRules(classNames: string[]): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  registerEmittedGlobals(emittedGlobalsJSON: string): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  replaceEmittedGlobals(emittedGlobalsJSON: string): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  refresh(manifestJSON: string, emittedGlobalsJSON?: string): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  snapshot(): {
    readonly version: number
    readonly rules: readonly unknown[]
    readonly resources: unknown
    readonly text: string
  }
  executionState(classNames: string[]): {
    readonly classes: readonly unknown[]
    readonly resources: unknown
  }
  inspect(className: string): {
    readonly version: number
    readonly className: string
    readonly valid: boolean
    readonly rules: readonly unknown[]
  }
  dispose(): void
}

interface MasterCSSWasmRenderProviderSession {
  nativeDeclarationCandidates(classNames: readonly string[]): unknown
  ensureClassRules(classNames: readonly string[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): unknown
  snapshot(): unknown
  snapshotForClassNames(classNames: readonly string[]): unknown
  dispose(): void
}

interface MasterCSSEngineWasmProvider {
  readonly info: unknown
  createEngineSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<MasterCSSWasmEngineProviderSession>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<MasterCSSWasmRenderProviderSession>
}

export async function createWasmEngineProvider(
  loader: MasterCSSWasmEngineLoader,
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  const module = await loader.loadWasmEngine(loadOptions) as { bindingInfo(): string }
  const provider: MasterCSSEngineWasmProvider = Object.freeze({
    info: JSON.parse(module.bindingInfo()) as unknown,
    createEngineSession: (manifestJSON, emittedGlobalsJSON) =>
      loader.createWasmEngineSession(
        manifestJSON,
        emittedGlobalsJSON === undefined ? {} : {
          emittedGlobals: JSON.parse(emittedGlobalsJSON)
        },
        loadOptions
      ),
    createRenderSession: (manifestJSON, emittedGlobalsJSON) =>
      loader.createWasmRenderSession(
        manifestJSON,
        emittedGlobalsJSON === undefined ? {} : {
          emittedGlobals: JSON.parse(emittedGlobalsJSON)
        },
        loadOptions
      )
  })
  return provider
}
