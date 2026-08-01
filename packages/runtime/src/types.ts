import type { MasterCSSEngine, MasterCSSEngineTransition } from '@master/css'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSManifest, MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import { LAYER_ORDER } from './host'

export interface MasterCSSRuntimeOptions {
  readonly manifest: MasterCSSManifest
  readonly root?: Document | ShadowRoot
  readonly emittedGlobals?: MasterCSSEmittedGlobals
  readonly hydrationManifest?: MasterCSSHydrationManifest
}

export type MasterCSSRuntimeBinding = 'auto' | 'native' | 'wasm'

export interface MasterCSSRuntimeStartOptions extends MasterCSSRuntimeOptions {
  readonly binding?: MasterCSSRuntimeBinding
  readonly startupTimeoutMs?: number
  readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void
}

export interface MasterCSSRuntimeRuleSnapshot {
  readonly key: string
  readonly layer: MasterCSSManifestUtilityLayerName
  readonly text: string
}

export interface MasterCSSRuntimeClassSnapshot {
  readonly usageCount: number
  readonly retained: boolean
  readonly rules: readonly MasterCSSRuntimeRuleSnapshot[]
}

export interface MasterCSSRuntimeLayerSnapshot {
  readonly name: typeof LAYER_ORDER[number] | 'keyframes'
  readonly cssText: string
  readonly ruleCount: number
}

export interface MasterCSSRuntimeSnapshot {
  readonly binding: MasterCSSEngine['binding']
  readonly cssText: string
  readonly observing: boolean
  readonly classRules: Readonly<Record<string, MasterCSSRuntimeClassSnapshot>>
  readonly usageCounts: Readonly<Record<string, number>>
  readonly layers: readonly MasterCSSRuntimeLayerSnapshot[]
  readonly hydration: {
    readonly state: 'none' | 'runtime' | 'progressive'
    readonly manifestLoaded: boolean
    readonly failureReason?: string
  }
}

export interface MasterCSSRuntimeFacade extends Disposable {
  readonly binding: MasterCSSEngine['binding']
  observe(): this
  disconnect(): this
  refresh(manifest?: MasterCSSManifest): this
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  snapshot(): MasterCSSRuntimeSnapshot
  dispose(): void
}
