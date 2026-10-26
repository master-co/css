import type { MasterCSSEngine, MasterCSSEngineTransition } from '@master/css'
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'
import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSManifestUtilityLayerName } from '@master/css-schema/manifest'
import type { MasterCSSHydrationManifest } from '@master/css-schema/hydration-manifest'
import { LAYER_ORDER } from './host'

/** A writable stylesheet supplied by its delivery adapter, in document order. */
export interface MasterCSSRuntimeStylesheet {
  readonly sheet: CSSStyleSheet
  readonly ownerIds: readonly string[]
}

/** A runtime program that `compileRuntimeProgram()` from `@master/css/node` compiled. */
export type MasterCSSRuntimeProgram = Uint8Array | ArrayBuffer

/** Loads the runtime program when the runtime starts its engine. */
export type MasterCSSRuntimeProgramLoader = () => Promise<MasterCSSRuntimeProgram>

/**
 * `deferred` keeps a progressive page on its pre-rendered CSS until a class
 * lacks it; `loading` and `failed` describe that start, `ready` executes rules.
 */
export type MasterCSSRuntimeEngineState = 'deferred' | 'loading' | 'ready' | 'failed'

export interface MasterCSSRuntimeOptions {
  readonly program: MasterCSSRuntimeProgram | MasterCSSRuntimeProgramLoader
  readonly root?: Document | ShadowRoot
  readonly emittedGlobals?: MasterCSSEmittedGlobals
  readonly hydrationManifest?: MasterCSSHydrationManifest
  /** Resolve current compiler-owned sheets after attachment or HMR. */
  readonly stylesheets?: () => readonly MasterCSSRuntimeStylesheet[]
  /** Official adapter asset root; linked assets include a compiler-issued sidecar. */
  readonly stylesheetDelivery?: { readonly base: string, readonly development?: boolean }
}

export type MasterCSSRuntimeBinding = 'auto' | 'native' | 'wasm'

export interface MasterCSSRuntimeStartOptions extends MasterCSSRuntimeOptions {
  readonly binding?: MasterCSSRuntimeBinding
  /**
   * Progressive pages with a hydration manifest defer the engine, its Wasm and
   * a lazy program until a class lacks pre-rendered CSS. `eager` starts it now.
   */
  readonly engine?: 'eager' | 'deferred'
  /** `idle` starts a deferred engine when the browser is idle, before a class needs it. */
  readonly enginePrefetch?: 'none' | 'idle'
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
  readonly name: typeof LAYER_ORDER[number]
  readonly cssText: string
  readonly ruleCount: number
}

export interface MasterCSSRuntimeSnapshot {
  readonly binding: MasterCSSEngine['binding'] | undefined
  readonly engine: MasterCSSRuntimeEngineState
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
  readonly binding: MasterCSSEngine['binding'] | undefined
  ready(): Promise<this>
  observe(): this
  disconnect(): this
  refresh(program?: MasterCSSRuntimeProgram, emittedGlobals?: MasterCSSEmittedGlobals): this
  ensureClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  deleteClassRules(classNames: readonly string[]): MasterCSSEngineTransition
  snapshot(): MasterCSSRuntimeSnapshot
  dispose(): void
}
