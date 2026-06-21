import { createMasterCSSMiddleware } from './server'

// @ts-expect-error virtual module
import manifest from 'virtual:master-css-manifest'

export const onRequest = createMasterCSSMiddleware(manifest)
