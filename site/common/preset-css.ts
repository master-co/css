import { createCSS } from '@master/css'
import type { MasterCSSPlan } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const presetCSS = createCSS(defaultPlan)

export const createPresetCSS = () => {
    return createCSS(defaultPlan)
}

export default presetCSS
