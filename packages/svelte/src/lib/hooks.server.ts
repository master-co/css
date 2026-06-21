/// <reference types="@master/css-integration/client" />

import manifest from 'virtual:master-css-manifest'
import { createMasterCSSHandle } from './server.js'

export {
    collectMasterCSSClasses,
    createMasterCSSChunkRenderer,
    createMasterCSSHandle,
    injectMasterStyle
} from './server.js'

const handle = createMasterCSSHandle({ manifest })

export { handle }
export default handle
