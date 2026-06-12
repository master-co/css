import { expect } from 'vitest'
import UtilityType from 'shared/utility-type'
import type {
    MasterCSSPlan,
    MasterCSSPlanCSSDeclarations,
    MasterCSSPlanUtilityLayerName,
    MasterCSSPlanUtilityRule
} from 'shared/master-css-plan'
import { createCSS, type MasterCSS } from '../../src'
import defaultPlan from '@master/css-preset/default-plan'

export type StaticRuleInput = MasterCSSPlanUtilityRule<MasterCSSPlanCSSDeclarations>

export interface StaticUtilityInput {
    name: string
    layer?: MasterCSSPlanUtilityLayerName
    rules: StaticRuleInput[]
}

export function clonePlan(plan: MasterCSSPlan = defaultPlan): MasterCSSPlan {
    return JSON.parse(JSON.stringify(plan)) as MasterCSSPlan
}

export function createDefaultCSS() {
    return createCSS(defaultPlan)
}

export function createPlanWithStaticUtilities(utilities: StaticUtilityInput[], basePlan = defaultPlan): MasterCSSPlan {
    const plan = clonePlan(basePlan)
    plan.utilities ??= []
    plan.utilityBuckets ??= {}
    plan.utilityBuckets.arbitrary ??= []

    for (const utility of utilities) {
        const index = plan.utilities.length
        const name = utility.name.startsWith('.') ? utility.name.slice(1) : utility.name
        plan.utilities.push({
            id: '.' + name,
            name,
            type: UtilityType.Static,
            order: index,
            layer: utility.layer || 'components',
            emit: {
                type: 'static',
                rules: utility.rules
            },
            matchers: [{
                type: 'static',
                name
            }]
        })
        plan.utilityBuckets.arbitrary.push(index)
    }

    return plan
}

export function createCSSWithStaticUtilities(utilities: StaticUtilityInput[]) {
    return createCSS(createPlanWithStaticUtilities(utilities))
}

export function expectClassText(css: MasterCSS, className: string, expected: string) {
    expect(css.create(className)?.text).toContain(expected)
}

export function expectLayerText(css: MasterCSS, classNames: string | string[], layer: keyof Pick<MasterCSS, 'themeLayer' | 'baseLayer' | 'defaultsLayer' | 'componentsLayer' | 'utilitiesLayer' | 'animationsNonLayer'>, expected: string) {
    css.add(...(Array.isArray(classNames) ? classNames : [classNames]))
    expect(css[layer].text).toContain(expected)
    css.remove(...(Array.isArray(classNames) ? classNames : [classNames]))
}
