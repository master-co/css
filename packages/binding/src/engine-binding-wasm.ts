import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type {
  MasterCSSBindingInfo,
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
  MasterCSSWasmBindingLoadOptions
} from './engine-binding'

export interface MasterCSSEngineWasmProviderContract {
  readonly info: MasterCSSBindingInfo
  createEngineSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<Readonly<{
    ensureClassRules(classNames: string[]): MasterCSSEngineTransition
    deleteClassRules(classNames: string[]): MasterCSSEngineTransition
    registerEmittedGlobals(emittedGlobalsJSON: string): MasterCSSEngineTransition
    refresh(manifestJSON: string): MasterCSSEngineTransition
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
    ensureClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
    ensureStylesheetResources(nativeCSS: string): void
    emittedGlobals(): MasterCSSEmittedGlobals
    snapshot(): MasterCSSServerRender
    snapshotForClassNames(classNames: readonly string[]): MasterCSSServerRender
    dispose(): void
  }>>
}

export type MasterCSSEngineWasmProviderFactory = (
  options?: MasterCSSWasmBindingLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBindingLoadOptions | undefined) {
  const { createMasterCSSEngineWasmProvider } = await import('@master/css-binding-wasm-engine')
  return await createMasterCSSEngineWasmProvider(options)
}

async function createWasmProvider(
  options: MasterCSSWasmBindingLoadOptions | undefined,
  factory: MasterCSSEngineWasmProviderFactory = loadDefaultWasmProvider
) {
  const provider = await factory(options) as MasterCSSEngineWasmProviderContract
  assertMasterCSSBindingInfo(provider.info, {
    surface: 'runtime',
    features: ['engine', 'render']
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

export async function createWasmEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSEngineBindingSession> {
  const provider = await createWasmProvider(loadOptions, providerFactory)
  const session = await provider.createEngineSession(
    serializeMasterCSSManifest(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const bound: MasterCSSEngineBindingSession = {
    ...lifecycle(session),
    ensureClassRules: (classNames) => session.ensureClassRules([...classNames]) as MasterCSSEngineTransition,
    deleteClassRules: (classNames) => session.deleteClassRules([...classNames]) as MasterCSSEngineTransition,
    registerEmittedGlobals: (emittedGlobals) =>
      session.registerEmittedGlobals(JSON.stringify(emittedGlobals)) as MasterCSSEngineTransition,
    refresh: (manifest) => session.refresh(serializeMasterCSSManifest(manifest)) as MasterCSSEngineTransition,
    inspect: (className) => session.inspect(className) as MasterCSSEngineInspection,
    snapshot: () => session.snapshot() as MasterCSSEngineSnapshot
  }
  return Object.freeze(bound)
}

export async function createWasmRenderBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSWasmBindingLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSRenderBindingSession> {
  const provider = await createWasmProvider(loadOptions, providerFactory)
  const session = await provider.createRenderSession(
    serializeMasterCSSManifest(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const bound: MasterCSSRenderBindingSession = {
    ...lifecycle(session),
    nativeDeclarationCandidates: (classNames) =>
      session.nativeDeclarationCandidates(classNames) as never,
    ensureClassRules: (classNames, nativeSupport) =>
      session.ensureClassRules(classNames, nativeSupport),
    ensureStylesheetResources: (nativeCSS) => session.ensureStylesheetResources(nativeCSS),
    emittedGlobals: () => session.emittedGlobals() as MasterCSSEmittedGlobals,
    snapshot: () => session.snapshot() as MasterCSSServerRender,
    snapshotForClassNames: (classNames) =>
      session.snapshotForClassNames(classNames) as MasterCSSServerRender
  }
  return Object.freeze(bound)
}
