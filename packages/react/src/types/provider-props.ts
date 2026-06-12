import type { MasterCSSPlan, MasterCSSPreloaded } from '@master/css-runtime'
import type { ReactNode } from 'react'

export interface CSSRuntimeProviderProps {
    children?: ReactNode,
    plan?: MasterCSSPlan,
    preloaded?: MasterCSSPreloaded,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
