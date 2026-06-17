import { createRequire } from 'node:module'
import type { MasterCSSPlan } from 'shared/master-css-plan'

const require = createRequire(import.meta.url)
let defaultPlan: MasterCSSPlan | undefined

export default function getDefaultPlan() {
    defaultPlan ??= require('@master/css-preset/default-plan.json') as MasterCSSPlan
    return defaultPlan
}
