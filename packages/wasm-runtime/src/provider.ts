import {
  createWasmEngineSession,
  createWasmRenderSession,
  loadWasmEngine
} from './index'

export type MasterCSSWasmEngineInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface MasterCSSWasmEngineLoadOptions {
  readonly module?: object
  readonly input?: MasterCSSWasmEngineInput
}

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
  refresh(manifestJSON: string): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  snapshot(): {
    readonly version: number
    readonly rules: readonly unknown[]
    readonly resources: unknown
    readonly text: string
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
  ensureClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
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

export async function createMasterCSSEngineWasmProvider(
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  const module = await loadWasmEngine(loadOptions) as { bindingInfo(): unknown }
  const provider: MasterCSSEngineWasmProvider = Object.freeze({
    info: module.bindingInfo(),
    createEngineSession: (manifestJSON, emittedGlobalsJSON) =>
      createWasmEngineSession(
        manifestJSON,
        emittedGlobalsJSON === undefined ? {} : {
          emittedGlobals: JSON.parse(emittedGlobalsJSON)
        },
        loadOptions
      ),
    createRenderSession: (manifestJSON, emittedGlobalsJSON) =>
      createWasmRenderSession(
        manifestJSON,
        emittedGlobalsJSON === undefined ? {} : {
          emittedGlobals: JSON.parse(emittedGlobalsJSON)
        },
        loadOptions
      )
  })
  return provider
}
