import type { CSSDirectiveSourceReference } from './css-directives.js'

/**
 * A native `@keyframes` rule of Master-compiled CSS. A `native` definition is
 * delivered in place by its stylesheet or the host, and engines never emit it.
 * Every other definition comes from a `@prune native` stylesheet and is emitted on
 * demand, like a token, by the engine whose output references it.
 */
export interface MasterCSSKeyframeDefinition {
  id: string
  name: string
  text: string
  /** The enclosing conditional and layer rules an emitted definition is wrapped in. */
  containers?: MasterCSSKeyframeContainer[]
  native?: boolean
  /** `@safelist keyframes` emits the definition without a reference. */
  safelisted?: boolean
  dependencies?: string[]
  source?: CSSDirectiveSourceReference
}

export interface MasterCSSKeyframeContainer {
  id: string
  prelude: string
}
