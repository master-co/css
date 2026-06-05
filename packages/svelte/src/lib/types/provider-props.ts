import type { Config } from '@master/css'
import type { MasterCSSPreloaded } from '@master/css/preloaded'

export interface CSSRuntimeProviderProps {
    config?: Config
    preloaded?: MasterCSSPreloaded
    root?: Document | ShadowRoot | null
}
