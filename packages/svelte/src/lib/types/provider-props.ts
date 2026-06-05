import type { Config, MasterCSSPreloaded } from '@master/css'

export interface CSSRuntimeProviderProps {
    config?: Config
    preloaded?: MasterCSSPreloaded
    root?: Document | ShadowRoot | null
}
