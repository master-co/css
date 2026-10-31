/** Resource counts already emitted outside the current Rust engine session. */
export interface MasterCSSEmittedGlobals {
  variables?: Record<string, number>
  /** Counts keyed by definition ID, rather than animation name. */
  keyframes?: Record<string, number>
}
