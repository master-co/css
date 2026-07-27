import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSServerRender
} from './protocol'
import { normalizeBindingError } from './normalize-error'
import type { MasterCSSBinding, MasterCSSResolvedBinding } from './protocol'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'
import { shouldLoadMasterCSSNativeBinding } from './binding-options'
import {
  createWasmEngineBindingSession,
  createWasmRenderBindingSession
} from './engine-binding-wasm'
import {
  bindEngineBindingSession,
  bindRenderBindingSession
} from './engine-binding-adapter'

async function loadNativeEngineFactories() {
  const nodeEngineModule = import.meta.url.endsWith('.ts') ? './engine.ts' : './engine.js'
  return await import(
    /* @vite-ignore */
    /* turbopackIgnore: true */
    nodeEngineModule
  ) as typeof import('./engine')
}

export type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'

export interface MasterCSSEngineBindingSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSEngineBindingSession extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransition
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export interface MasterCSSRenderBindingSession extends Disposable {
  readonly binding: MasterCSSResolvedBinding
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

export async function createEngineBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSEngineBindingSession> {
  try {
    if (shouldLoadMasterCSSNativeBinding(loadOptions.binding)) {
      const { createNativeEngineSession } = await loadNativeEngineFactories()
      const native = createNativeEngineSession(options, {
        ...loadOptions.native,
        required: loadOptions.binding === 'native'
      })
      if (native) return bindEngineBindingSession('native', native)
    }
    return bindEngineBindingSession(
      'wasm',
      await createWasmEngineBindingSession(options, loadOptions.wasm)
    )
  } catch (cause) {
    throw normalizeBindingError(cause, 'engine')
  }
}

export async function createRenderBindingSession(
  options: MasterCSSEngineBindingSessionOptions,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<MasterCSSRenderBindingSession> {
  try {
    if (shouldLoadMasterCSSNativeBinding(loadOptions.binding)) {
      const { createNativeRenderSession } = await loadNativeEngineFactories()
      const native = createNativeRenderSession(options, {
        ...loadOptions.native,
        required: loadOptions.binding === 'native'
      })
      if (native) return bindRenderBindingSession('native', native)
    }
    return bindRenderBindingSession(
      'wasm',
      await createWasmRenderBindingSession(options, loadOptions.wasm)
    )
  } catch (cause) {
    throw normalizeBindingError(cause, 'server')
  }
}
