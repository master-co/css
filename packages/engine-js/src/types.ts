/**
 * Emitted globals the host already serves: variable and keyframe usage counts,
 * keyframe slots, and keyframes whose emission is suppressed. Structurally equal to
 * `@master/css-schema/emitted-globals`; redeclared so the engine stays dependency-free.
 */
export interface EmittedGlobals {
  variables?: Record<string, number>
  keyframes?: Record<string, number>
  keyframeSlots?: string[]
  suppressedKeyframes?: string[]
}

/** One CSSOM change a transition asks the host to apply, as the Rust engine reports it. */
export type RuleMutation = Readonly<Record<string, unknown>>

export interface Transition {
  readonly version: number
  readonly mutations: readonly RuleMutation[]
}

export interface Snapshot {
  readonly version: number
  readonly rules: readonly unknown[]
  readonly resources: unknown
  readonly text: string
}

export interface ExecutionState {
  readonly classes: readonly unknown[]
  readonly resources: unknown
}

export interface KeyframeDefinition {
  readonly name: string
  readonly [field: string]: unknown
}

/**
 * The browser engine session. Same semantics as the Rust `EngineSession` the runtime
 * hosts today, with results returned as JS objects instead of JSON text.
 */
export interface EngineSession {
  ensureClassRules(classNames: readonly string[]): Transition
  deleteClassRules(classNames: readonly string[]): Transition
  registerEmittedGlobals(emittedGlobals: EmittedGlobals): Transition
  replaceEmittedGlobals(emittedGlobals: EmittedGlobals): Transition
  refresh(program: Uint8Array, emittedGlobals?: EmittedGlobals): Transition
  keyframeDefinitions(): readonly KeyframeDefinition[]
  executionState(classNames: readonly string[]): ExecutionState
  snapshot(): Snapshot
  dispose(): void
}
