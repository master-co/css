import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSKeyframeDefinition, MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSBindingInfo,
  MasterCSSEngineExecutionState,
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSServerRender
} from './protocol'
import { assertMasterCSSBindingInfo } from './binding'
import type {
  MasterCSSEngineBindingSession,
  MasterCSSEngineBindingSessionOptions,
  MasterCSSRenderBindingSession,
  MasterCSSRenderBindingSessionOptions,
  MasterCSSWasmBindingLoadOptions
} from './engine-binding'

export interface MasterCSSEngineWasmProviderContract {
  readonly info: MasterCSSBindingInfo
  /** `source` is a compiled runtime program, or manifest JSON for the `full` artifact. */
  createEngineSession(
    source: Uint8Array | string,
    emittedGlobals?: MasterCSSEmittedGlobals
  ): Promise<Readonly<{
    ensureClassRules(classNames: string[]): MasterCSSEngineTransition
    deleteClassRules(classNames: string[]): MasterCSSEngineTransition
    registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
    replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
    refresh(source: Uint8Array | string, emittedGlobals?: MasterCSSEmittedGlobals): MasterCSSEngineTransition
    keyframeDefinitions(): readonly MasterCSSKeyframeDefinition[]
    executionState(classNames: readonly string[]): MasterCSSEngineExecutionState
    inspect(className: string): MasterCSSEngineInspection
    snapshot(): MasterCSSEngineSnapshot
    dispose(): void
  }>>
  createRenderSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<Readonly<{
    nativeDeclarationCandidates:
      MasterCSSRenderBindingSession['nativeDeclarationCandidates']
    ensureClassRules(classNames: readonly string[]): void
    ensureStylesheetResources(nativeCSS: string): void
    emittedGlobals(): MasterCSSEmittedGlobals
    snapshot(): MasterCSSServerRender
    snapshotForClassNames(classNames: readonly string[]): MasterCSSServerRender
    dispose(): void
  }>>
  /** Available from the `full` artifact only. */
  compileRuntimeProgram(manifestJSON: string): Promise<Uint8Array>
}

export type MasterCSSEngineWasmProviderFactory = (
  options?: MasterCSSWasmBindingLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBindingLoadOptions | undefined) {
  const { createMasterCSSEngineWasmProvider } = await import('@master/css-binding-wasm-engine')
  return await createMasterCSSEngineWasmProvider(options)
}

async function createWasmProvider(
  feature: 'engine' | 'render',
  options: MasterCSSWasmBindingLoadOptions | undefined,
  factory: MasterCSSEngineWasmProviderFactory = loadDefaultWasmProvider
) {
  const provider = await factory(options) as MasterCSSEngineWasmProviderContract
  // The browser runtime artifact ships only the engine feature.
  assertMasterCSSBindingInfo(provider.info, {
    surface: 'runtime',
    features: [feature]
  })
  return provider
}

function lifecycle(session: { dispose(): void }) {
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    session.dispose()
  }
  return { binding: 'wasm' as const, dispose, [Symbol.dispose]: dispose }
}

function wasmSource(source: MasterCSSManifest | Uint8Array) {
  return ArrayBuffer.isView(source) ? source : serializeMasterCSSManifest(source)
}

export async function createWasmEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSEngineBindingSession> {
  const provider = await createWasmProvider('engine', loadOptions, providerFactory)
  const session = await provider.createEngineSession(
    wasmSource(options.program ?? options.manifest),
    options.emittedGlobals
  )
  const bound: MasterCSSEngineBindingSession = {
    ...lifecycle(session),
    ensureClassRules: (classNames) => session.ensureClassRules([...classNames]) as MasterCSSEngineTransition,
    deleteClassRules: (classNames) => session.deleteClassRules([...classNames]) as MasterCSSEngineTransition,
    registerEmittedGlobals: (emittedGlobals) =>
      session.registerEmittedGlobals(emittedGlobals) as MasterCSSEngineTransition,
    replaceEmittedGlobals: (emittedGlobals) =>
      session.replaceEmittedGlobals(emittedGlobals) as MasterCSSEngineTransition,
    refresh: (source, emittedGlobals) =>
      session.refresh(wasmSource(source), emittedGlobals) as MasterCSSEngineTransition,
    keyframeDefinitions: () => session.keyframeDefinitions(),
    executionState: (classNames) => session.executionState([...classNames]) as MasterCSSEngineExecutionState,
    inspect: (className) => session.inspect(className) as MasterCSSEngineInspection,
    snapshot: () => session.snapshot() as MasterCSSEngineSnapshot
  }
  return Object.freeze(bound)
}

export async function createWasmRenderBindingSession(
  options: MasterCSSRenderBindingSessionOptions,
  loadOptions: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSRenderBindingSession> {
  const provider = await createWasmProvider('render', loadOptions, providerFactory)
  const session = await provider.createRenderSession(
    serializeMasterCSSManifest(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const bound: MasterCSSRenderBindingSession = {
    ...lifecycle(session),
    nativeDeclarationCandidates: (classNames) =>
      session.nativeDeclarationCandidates(classNames) as never,
    ensureClassRules: (classNames) =>
      session.ensureClassRules(classNames),
    ensureStylesheetResources: (nativeCSS) => session.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => session.emittedGlobals() as MasterCSSEmittedGlobals,
    snapshot: () => session.snapshot() as MasterCSSServerRender,
    snapshotForClassNames: (classNames) =>
      session.snapshotForClassNames(classNames) as MasterCSSServerRender
  }
  return Object.freeze(bound)
}

export async function compileWasmRuntimeProgram(
  manifest: MasterCSSManifest,
  loadOptions: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<Uint8Array> {
  const provider = await createWasmProvider('engine', loadOptions, providerFactory)
  return await provider.compileRuntimeProgram(serializeMasterCSSManifest(manifest))
}
