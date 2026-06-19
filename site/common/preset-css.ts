import { createCSSWithNativeDeclarations } from '@master/css-validator'
import type { MasterCSSPlan } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const presetCSS = createCSSWithNativeDeclarations(defaultPlan)

export default presetCSS
