import type { Config } from '@master/css'

export interface CSSRuntimeProviderProps {
    config?: Config
    root?: Document | ShadowRoot | null
}
