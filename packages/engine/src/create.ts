import type { MasterCSSPreloaded } from './preloaded'
import MasterCSS, { type MasterCSSOptions } from './core'
import type { MasterCSSPlan } from 'shared/master-css-plan'

export default function createCSS(
    plan: MasterCSSPlan,
    preloaded?: MasterCSSPreloaded,
    options?: MasterCSSOptions
) {
    return new MasterCSS(plan, preloaded, options)
}
