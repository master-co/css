import { createMasterCSSMiddleware } from './server'

// @ts-expect-error virtual module
import config from 'virtual:master-css-config'

export const onRequest = createMasterCSSMiddleware(config)
