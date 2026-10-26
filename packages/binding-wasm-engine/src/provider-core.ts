import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSKeyframeDefinition } from '@master/css-schema/manifest'
import type { MasterCSSWasmEngineLoader, MasterCSSWasmEngineSource } from './index'
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
  registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  refresh(source: MasterCSSWasmEngineSource, emittedGlobals?: MasterCSSEmittedGlobals): {
    readonly version: number
    readonly mutations: readonly unknown[]
  }
  keyframeDefinitions(): readonly MasterCSSKeyframeDefinition[]
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
  /** `source` is a compiled runtime program, or manifest JSON for the `full` artifact. */
  createEngineSession(
    source: MasterCSSWasmEngineSource,
    emittedGlobals?: MasterCSSEmittedGlobals
  ): Promise<MasterCSSWasmEngineProviderSession>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<MasterCSSWasmRenderProviderSession>
  /** Available from the `full` artifact only. */
  compileRuntimeProgram(manifestJSON: string): Promise<Uint8Array>
}

export async function createWasmEngineProvider(
  loader: MasterCSSWasmEngineLoader,
  loadOptions: MasterCSSWasmEngineLoadOptions = {}
): Promise<object> {
  const module = await loader.loadWasmEngine(loadOptions) as { bindingInfo(): string }
  const provider: MasterCSSEngineWasmProvider = Object.freeze({
    info: JSON.parse(module.bindingInfo()) as unknown,
    createEngineSession: (source, emittedGlobals) =>
      loader.createWasmEngineSession(source, { emittedGlobals }, loadOptions),
    createRenderSession: (manifestJSON, emittedGlobalsJSON) =>
      loader.createWasmRenderSession(
        manifestJSON,
        emittedGlobalsJSON === undefined ? {} : {
          emittedGlobals: JSON.parse(emittedGlobalsJSON)
        },
        loadOptions
      ),
    compileRuntimeProgram: (manifestJSON) =>
      loader.compileRuntimeProgram(manifestJSON, loadOptions)
  })
  return provider
}
