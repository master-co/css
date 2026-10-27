import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSKeyframeDefinition, MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSEngineExecutionState,
  MasterCSSEngineInspection,
  MasterCSSEngineSnapshot,
  MasterCSSEngineTransition,
  MasterCSSNativeDeclarationCandidate,
  MasterCSSServerRender
} from './protocol'

export interface MasterCSSNativeModuleOptions {
  readonly bindingPath?: string
  readonly required?: boolean
}

/**
 * What an engine session executes: a manifest, which only Node hosts compile, or a
 * runtime program that `compileRuntimeProgram()` encoded.
 */
export type MasterCSSEngineSource =
  | { readonly manifest: MasterCSSManifest, readonly program?: never }
  | { readonly program: Uint8Array, readonly manifest?: never }

export type MasterCSSNativeEngineSessionOptions = MasterCSSEngineSource & {
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSNativeRenderSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSNativeEngineSession extends Disposable {
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

export interface MasterCSSNativeRenderSession extends Disposable {
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
