import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type {
  MasterCSSEngineInspectionIR,
  MasterCSSEngineSnapshotIR,
  MasterCSSEngineTransitionIR,
  MasterCSSNativeDeclarationCandidateIR,
  MasterCSSServerRenderIR
} from './protocol'

export interface MasterCSSNativeModuleOptions {
  readonly bindingPath?: string
  readonly required?: boolean
}

export interface MasterCSSNativeEngineSessionOptions {
  readonly manifest: MasterCSSManifest
  readonly emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSNativeEngineSession extends Disposable {
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransitionIR
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransitionIR
  refresh(manifest: MasterCSSManifest): MasterCSSEngineTransitionIR
  inspect(className: string): MasterCSSEngineInspectionIR
  snapshot(): MasterCSSEngineSnapshotIR
  dispose(): void
}

export interface MasterCSSNativeRenderSession extends Disposable {
  nativeDeclarationCandidates(
    classNames: readonly string[]
  ): readonly MasterCSSNativeDeclarationCandidateIR[]
  ensureClassRules(classNames: readonly string[], nativeSupport?: readonly boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): MasterCSSEmittedGlobals
  snapshot(): MasterCSSServerRenderIR
  snapshotForClassNames(classNames: readonly string[]): MasterCSSServerRenderIR
  dispose(): void
}
