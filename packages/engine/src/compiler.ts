import MasterCSS from './core'
import createCSS from './create'
import parseAt from './utils/parse-at'
import generateAt from './utils/generate-at'
import parseSelector from './utils/parse-selector'
import generateSelector from './utils/generate-selector'
import compareRulePriority from './utils/compare-rule-priority'
import type { Utility } from './utility'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import type { MasterCSSPreloaded } from './preloaded'
import type { MasterCSSOptions } from './core'

export { MasterCSS, createCSS, compareRulePriority, generateAt, generateSelector, parseAt, parseSelector }
export type { Utility as GeneratedRule }
export type * from 'shared/master-css-plan'

export function createCompilerCSS(plan: MasterCSSPlan, preloaded?: MasterCSSPreloaded, options?: MasterCSSOptions) {
    return createCSS(plan, preloaded, options)
}

export function expandClassName(plan: MasterCSSPlan, className: string, mode?: string) {
    return createCompilerCSS(plan).createAll(className, undefined, mode)
}

export function inspectGeneratedRule(rule: Utility) {
    return {
        className: rule.name,
        key: rule.key,
        layer: rule.layerName,
        explicitLayer: rule.explicitLayerName,
        selector: rule.selectorText,
        declarations: rule.declarations,
        declarationRules: rule.declarationRules,
        atRules: rule.atRules,
        priority: rule.priority,
        variableNames: rule.variableNames ? [...rule.variableNames] : [],
        animationNames: rule.animationNames ? [...rule.animationNames] : []
    }
}
