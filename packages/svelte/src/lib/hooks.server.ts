/// <reference types="@master/css/client" />

import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
import { createMasterCSSHandle } from './server.js'

export {
  createMasterCSSHandle
} from './server.js'
export type {
  MasterCSSSvelteHandleOptions,
  MasterCSSSvelteHydrationManifestOption
} from './server.js'

const handle = createMasterCSSHandle({ manifest, emittedGlobals })

export { handle }
