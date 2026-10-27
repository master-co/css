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

export type UtilityLayerName = 'base' | 'defaults' | 'components' | 'utilities'
export type RuleTarget = 'theme' | 'keyframes' | UtilityLayerName

export interface ConditionBound {
  value: number
  inclusive: boolean
}

export interface ConditionFeature {
  domain: string
  feature: string
  unit: string
  lower: ConditionBound | null
  upper: ConditionBound | null
}

export interface RulePriority {
  features: ConditionFeature[]
  selector: number
  conditions?: string[]
  valuePriority?: number
  sortKey?: string
}

/** A generated rule as the Rust engine reports it; optional fields are absent when empty. */
export interface GeneratedRule {
  className: string
  key: string
  layer: UtilityLayerName
  type: number
  sortTier: number
  priority: RulePriority
  text: string
  nodes?: { text: string }[]
  selectorText?: string
  variableNames?: string[]
  keyframeNames?: string[]
  retainAllKeyframes?: boolean
}

/** One CSSOM change a transition asks the host to apply. */
export type RuleMutation =
  | { readonly op: 'insert', readonly target: RuleTarget, readonly index: number, readonly key: string, readonly text: string, readonly rule?: GeneratedRule }
  | { readonly op: 'delete', readonly target: RuleTarget, readonly index: number, readonly key: string }

export interface Transition {
  readonly version: number
  readonly mutations: readonly RuleMutation[]
}

export interface VariableResource {
  name: string
  refCount: number
  dependencies?: string[]
}

export interface Resources {
  themeText?: string
  variables: VariableResource[]
  keyframes: unknown[]
}

export interface Snapshot {
  readonly version: number
  readonly rules: readonly GeneratedRule[]
  readonly resources: Resources
  readonly text: string
}

export interface ExecutionState {
  readonly classes: readonly { className: string, references: { layer: UtilityLayerName, key: string }[] }[]
  readonly resources: Resources
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
