import type { MasterCSSPreloaded } from './preloaded'
import MasterCSS from './core'
import type { MasterCSSPlan } from 'shared/master-css-plan'

export default function createCSS(plan: MasterCSSPlan, preloaded?: MasterCSSPreloaded) {
    return new MasterCSS(plan, preloaded)
}
