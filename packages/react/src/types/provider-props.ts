import type { Config } from '@master/css'
import type { MasterCSSPreloaded } from '@master/css/preloaded'
import type { ReactNode } from 'react'

export interface CSSRuntimeProviderProps {
    children?: ReactNode,
    config?: Config,
    preloaded?: MasterCSSPreloaded,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
