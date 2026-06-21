import type { MasterCSSManifest, MasterCSSEmittedGlobals, MasterCSSHydrationManifest } from '@master/css-runtime'

export interface CSSRuntimeProviderProps {
    manifest: MasterCSSManifest
    emittedGlobals?: MasterCSSEmittedGlobals
    hydrationManifest?: MasterCSSHydrationManifest
    root?: Document | ShadowRoot | null
}
