import type { Config } from 'shared/css-config'
import type { MasterCSSPreloaded } from 'shared/css-preloaded-module'
import type { ReactNode } from 'react'

export interface CSSRuntimeProviderProps {
    children?: ReactNode,
    config?: Config,
    preloaded?: MasterCSSPreloaded,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
