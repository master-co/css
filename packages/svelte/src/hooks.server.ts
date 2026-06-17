import { createMasterCSSHandle } from './lib/server.js'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from '@master/css-runtime'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

export const handle = createMasterCSSHandle({ plan: defaultPlan })
