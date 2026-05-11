/// <reference types="@master/css.vite/client" />

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
