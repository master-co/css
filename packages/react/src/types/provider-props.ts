import type { MasterCSSManifest, MasterCSSEmittedGlobals, MasterCSSHydrationManifest } from '@master/css-runtime'
import type { ReactNode } from 'react'

export interface CSSRuntimeProviderProps {
    children?: ReactNode,
    manifest: MasterCSSManifest,
    emittedGlobals?: MasterCSSEmittedGlobals,
    hydrationManifest?: MasterCSSHydrationManifest,
    root?: Document | ShadowRoot | null // null for Element.shadowRoot
}
