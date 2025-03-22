import type { Config } from '@master/css'
import type { ReactNode } from 'react'

export default interface CSSRuntimeProviderProps {
    children?: ReactNode,
    config?: Config,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
