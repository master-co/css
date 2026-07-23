import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSServerRender
} from './protocol'
import { normalizeBackendError } from './normalize-error'
import type { MasterCSSBackend, MasterCSSResolvedBackend } from './protocol'
import type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'
import { shouldLoadMasterCSSNativeBackend } from './backend-options'
import {
  createWasmEngineBackendSession,
  createWasmRenderBackendSession
} from './broker-engine-wasm'
import {
  bindEngineBackendSession,
  bindRenderBackendSession
} from './broker-engine-adapter'

async function loadNativeEngineFactories() {
  const nodeEngineModule = import.meta.url.endsWith('.ts') ? './engine.ts' : './engine.js'
  return await import(/* @vite-ignore */ nodeEngineModule) as typeof import('./engine')
}

export type {
  MasterCSSBackendLoadOptions,
  MasterCSSNativeBackendLoadOptions,
  MasterCSSWasmBackendLoadOptions
} from './backend-options'

export interface MasterCSSEngineBackendSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSEngineBackendSession extends Disposable {
  readonly backend: MasterCSSResolvedBackend
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransition
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export interface MasterCSSRenderBackendSession extends Disposable {
  readonly backend: MasterCSSResolvedBackend
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  ensureClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): MasterCSSEmittedGlobals
  snapshot(): MasterCSSServerRender
  snapshotForClassNames(classNames: readonly string[]): MasterCSSServerRender
  dispose(): void
}

export async function createEngineBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSEngineBackendSession> {
  try {
    if (shouldLoadMasterCSSNativeBackend(loadOptions.backend)) {
      const { createNativeEngineSession } = await loadNativeEngineFactories()
      const native = createNativeEngineSession(options, {
        ...loadOptions.native,
        required: loadOptions.backend === 'native'
      })
      if (native) return bindEngineBackendSession('native', native)
    }
    return bindEngineBackendSession(
      'wasm',
      await createWasmEngineBackendSession(options, loadOptions.wasm)
    )
  } catch (cause) {
    throw normalizeBackendError(cause, 'engine')
  }
}

export async function createRenderBackendSession(
  options: MasterCSSEngineBackendSessionOptions,
  loadOptions: MasterCSSBackendLoadOptions = {}
): Promise<MasterCSSRenderBackendSession> {
  try {
    if (shouldLoadMasterCSSNativeBackend(loadOptions.backend)) {
      const { createNativeRenderSession } = await loadNativeEngineFactories()
      const native = createNativeRenderSession(options, {
        ...loadOptions.native,
        required: loadOptions.backend === 'native'
      })
      if (native) return bindRenderBackendSession('native', native)
    }
    return bindRenderBackendSession(
      'wasm',
      await createWasmRenderBackendSession(options, loadOptions.wasm)
    )
  } catch (cause) {
    throw normalizeBackendError(cause, 'server')
  }
}
