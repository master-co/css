import type { MasterCSSPlan, MasterCSSPreloaded, MasterCSSRuntimeManifest } from '@master/css-runtime'

export interface CSSRuntimeProviderProps {
    plan: MasterCSSPlan
    preloaded?: MasterCSSPreloaded
    manifest?: MasterCSSRuntimeManifest
    root?: Document | ShadowRoot | null
}
