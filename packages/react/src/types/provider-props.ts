import type { Config } from 'shared/css-config'
import type { ReactNode } from 'react'

export default interface CSSRuntimeProviderProps {
    children?: ReactNode,
    config?: Config,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
