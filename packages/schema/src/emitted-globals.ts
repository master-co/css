/** Resource counts already emitted outside the current Rust engine session. */
export interface MasterCSSEmittedGlobals {
  variables?: Record<string, number>
  animations?: Record<string, number>
}
