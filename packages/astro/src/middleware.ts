import { createMasterCSSMiddleware } from './server'

// @ts-expect-error virtual module
import plan from 'virtual:master-css-plan'

export const onRequest = createMasterCSSMiddleware(plan)
