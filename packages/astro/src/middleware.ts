import { createMasterCSSMiddleware } from './server'

// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

export const onRequest = createMasterCSSMiddleware(manifest, emittedGlobals)
