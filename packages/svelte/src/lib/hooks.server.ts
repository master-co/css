/// <reference types="@master/css-integration/client" />

import plan from 'virtual:master-css-plan.json'
import { createMasterCSSHandle } from './server.js'

export {
    collectMasterCSSClasses,
    createMasterCSSChunkRenderer,
    createMasterCSSHandle,
    injectMasterStyle
} from './server.js'

const handle = createMasterCSSHandle({ plan })

export { handle }
export default handle
