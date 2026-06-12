import type { MasterCSSPlan, MasterCSSPreloaded } from '@master/css-runtime'

export interface CSSRuntimeProviderProps {
    plan?: MasterCSSPlan
    preloaded?: MasterCSSPreloaded
    root?: Document | ShadowRoot | null
}
