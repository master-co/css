/// <reference types="@master/css-integration/client" />

import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
import { createMasterCSSHandle } from './server.js'

export {
    collectMasterCSSClasses,
    createMasterCSSChunkRenderer,
    createMasterCSSHandle,
    createMasterCSSStaticHydrationManifestWriter,
    injectMasterStyle
} from './server.js'
export type {
    MasterCSSStaticHydrationManifestWriterOptions,
    MasterCSSSvelteChunkRendererOptions,
    MasterCSSSvelteHandleOptions,
    MasterCSSSvelteHydrationManifestOption
} from './server.js'

const handle = createMasterCSSHandle({ manifest, emittedGlobals })

export { handle }
export default handle
