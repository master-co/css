/// <reference types="@master/css-integration/client" />

import config from 'virtual:master-css-config'
import { createMasterCSSHandle } from './server.js'

export {
    collectMasterCSSClasses,
    createMasterCSSChunkRenderer,
    createMasterCSSHandle,
    injectMasterStyle
} from './server.js'

const handle = createMasterCSSHandle({ config })

export { handle }
export default handle
