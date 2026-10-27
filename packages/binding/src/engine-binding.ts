import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSKeyframeDefinition, MasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSEngineSource } from './engine-contract'
import type {
  MasterCSSEngineExecutionState,
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSServerRender
} from './protocol'
import { normalizeBindingError } from './normalize-error'
import type { MasterCSSBinding, MasterCSSEngineResolvedBinding, MasterCSSResolvedBinding } from './protocol'
import type {
  MasterCSSBindingLoadOptions,
  MasterCSSNativeBindingLoadOptions,
  MasterCSSWasmBindingLoadOptions
} from './binding-options'
import { hasMasterCSSNodeRuntime, shouldLoadMasterCSSNativeBinding } from './binding-options'
import {
  compileWasmRuntimeProgram,
  createWasmEngineBindingSession,
  createWasmRenderBindingSession
} from './engine-binding-wasm'
import {
  bindEngineBindingSession,
  bindRenderBindingSession
} from './engine-binding-adapter'
import { createJavaScriptEngineBindingSession } from './engine-binding-js'

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

export type { MasterCSSEngineSource } from './engine-contract'

export type MasterCSSEngineBindingSessionOptions = MasterCSSEngineSource & {
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSRenderBindingSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSEngineBindingSession extends Disposable {
  readonly binding: MasterCSSEngineResolvedBinding
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  registerEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  replaceEmittedGlobals(emittedGlobals: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  refresh(source: MasterCSSManifest | Uint8Array, emittedGlobals?: MasterCSSEmittedGlobals): MasterCSSEngineTransition
  keyframeDefinitions(): readonly MasterCSSKeyframeDefinition[]
  executionState(classNames: readonly string[]): MasterCSSEngineExecutionState
  inspect(className: string): MasterCSSEngineInspection
  snapshot(): MasterCSSEngineSnapshot
  dispose(): void
}

export interface MasterCSSRenderBindingSession extends Disposable {
  readonly binding: MasterCSSResolvedBinding
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidate[]
  ensureClassRules(classNames: readonly string[]): void
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
    // Hosts without Node execute programs with the JavaScript engine, as the browser
    // entry does, whichever entry a bundler resolves; Wasm compiles their manifests.
    if (loadOptions.binding !== 'wasm' && options.program && !hasMasterCSSNodeRuntime()) {
      return createJavaScriptEngineBindingSession(options)
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
  options: MasterCSSRenderBindingSessionOptions,
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

/** Compiles a manifest into the runtime program that browsers execute. */
export async function compileRuntimeProgram(
  manifest: MasterCSSManifest,
  loadOptions: MasterCSSBindingLoadOptions = {}
): Promise<Uint8Array> {
  try {
    if (shouldLoadMasterCSSNativeBinding(loadOptions.binding)) {
      const { compileNativeRuntimeProgram } = await loadNativeEngineFactories()
      const program = compileNativeRuntimeProgram(manifest, {
        ...loadOptions.native,
        required: loadOptions.binding === 'native'
      })
      if (program) return program
    }
    return await compileWasmRuntimeProgram(manifest, loadOptions.wasm)
  } catch (cause) {
    throw normalizeBindingError(cause, 'engine')
  }
}
