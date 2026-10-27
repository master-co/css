import { createMasterCSSMiddleware } from './server'

// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'
// @ts-expect-error virtual module
import emittedGlobals from 'virtual:master-css-emitted-globals'

declare const __MASTER_CSS_ASTRO_PROGRESSIVE__: boolean

export const onRequest = createMasterCSSMiddleware(manifest, emittedGlobals, __MASTER_CSS_ASTRO_PROGRESSIVE__)
