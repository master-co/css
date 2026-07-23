import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type {
  MasterCSSBackendInfo,
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSServerRender
} from './protocol'
import { assertMasterCSSBackendInfo } from './binding'
import type {
  MasterCSSEngineBackendSession,
  MasterCSSEngineBackendSessionOptions,
  MasterCSSRenderBackendSession,
  MasterCSSWasmBackendLoadOptions
} from './broker-engine'

export interface MasterCSSEngineWasmProviderContract {
  readonly info: MasterCSSBackendInfo
  createEngineSession(
    manifestJSON: string,
    emittedGlobalsJSON?: string
  ): Promise<Readonly<{
    ensureClassRules(classNames: string[]): MasterCSSEngineTransition
    deleteClassRules(classNames: string[]): MasterCSSEngineTransition
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
      MasterCSSRenderBackendSession['nativeDeclarationCandidates']
    ensureClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
    ensureStylesheetResources(nativeCSS: string): void
    emittedGlobals(): MasterCSSEmittedGlobals
    snapshot(): MasterCSSServerRender
    snapshotForClassNames(classNames: readonly string[]): MasterCSSServerRender
    dispose(): void
  }>>
}

export type MasterCSSEngineWasmProviderFactory = (
  options?: MasterCSSWasmBackendLoadOptions
) => Promise<object>

async function loadDefaultWasmProvider(options: MasterCSSWasmBackendLoadOptions | undefined) {
  const { createMasterCSSEngineWasmProvider } = await import('@master/css-wasm-engine')
  return await createMasterCSSEngineWasmProvider(options)
}

async function createWasmProvider(
  options: MasterCSSWasmBackendLoadOptions | undefined,
  factory: MasterCSSEngineWasmProviderFactory = loadDefaultWasmProvider
) {
  const provider = await factory(options) as MasterCSSEngineWasmProviderContract
  assertMasterCSSBackendInfo(provider.info, {
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
  return { backend: 'wasm' as const, dispose, [Symbol.dispose]: dispose }
}

export async function createWasmEngineBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSWasmBackendLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSEngineBackendSession> {
  const provider = await createWasmProvider(loadOptions, providerFactory)
  const session = await provider.createEngineSession(
    serializeMasterCSSManifest(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const bound: MasterCSSEngineBackendSession = {
    ...lifecycle(session),
    ensureClassRules: (classNames) => session.ensureClassRules([...classNames]) as MasterCSSEngineTransition,
    deleteClassRules: (classNames) => session.deleteClassRules([...classNames]) as MasterCSSEngineTransition,
    refresh: (manifest) => session.refresh(serializeMasterCSSManifest(manifest)) as MasterCSSEngineTransition,
    inspect: (className) => session.inspect(className) as MasterCSSEngineInspection,
    snapshot: () => session.snapshot() as MasterCSSEngineSnapshot
  }
  return Object.freeze(bound)
}

export async function createWasmRenderBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSWasmBackendLoadOptions | undefined,
  providerFactory?: MasterCSSEngineWasmProviderFactory
): Promise<MasterCSSRenderBackendSession> {
  const provider = await createWasmProvider(loadOptions, providerFactory)
  const session = await provider.createRenderSession(
    serializeMasterCSSManifest(options.manifest),
    options.emittedGlobals ? JSON.stringify(options.emittedGlobals) : undefined
  )
  const bound: MasterCSSRenderBackendSession = {
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
