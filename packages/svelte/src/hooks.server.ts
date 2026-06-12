import { createMasterCSSHandle } from './lib/server.js'
import { defaultPlan } from '@master/css'

export const handle = createMasterCSSHandle({ plan: defaultPlan })
