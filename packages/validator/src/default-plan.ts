import { createRequire } from 'node:module'
import type { MasterCSSPlan } from 'shared/master-css-plan'

const require = createRequire(import.meta.url)
const defaultPlan = require('@master/css-preset/default-plan.json') as MasterCSSPlan

export default defaultPlan
