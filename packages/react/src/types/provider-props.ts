import type { MasterCSSPlan, MasterCSSPreloaded, MasterCSSRuntimeManifest } from '@master/css-runtime'
import type { ReactNode } from 'react'

export interface CSSRuntimeProviderProps {
    children?: ReactNode,
    plan: MasterCSSPlan,
    preloaded?: MasterCSSPreloaded,
    manifest?: MasterCSSRuntimeManifest,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
