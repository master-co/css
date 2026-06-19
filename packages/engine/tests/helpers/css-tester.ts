import { expect } from 'vitest'
import UtilityType from 'shared/utility-type'
import type {
    MasterCSSPlan,
    MasterCSSPlanCSSDeclarations,
    MasterCSSPlanVariable,
    MasterCSSPlanUtilityLayerName,
    MasterCSSPlanUtilityRule
} from 'shared/master-css-plan'
import { createCSS, type MasterCSS } from '../../src'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const nativeFallbackProperties = new Set([
    'animation-direction',
    'animation-fill-mode',
    'animation-iteration-count',
    'animation-play-state',
    'accent-color',
    'appearance',
    'align-content',
    'align-items',
    'align-self',
    'aspect-ratio',
    'backface-visibility',
    'background',
    'background-blend-mode',
    'background-clip',
    'background-origin',
    'border-block-end-style',
    'border-block-end-width',
    'border-block-start-style',
    'border-block-start-width',
    'border-block-style',
    'border-block-width',
    'border-bottom-style',
    'border-bottom-width',
    'border-image',
    'border-inline-end-style',
    'border-inline-end-width',
    'border-inline-start-style',
    'border-inline-start-width',
    'border-inline-style',
    'border-inline-width',
    'border-left-style',
    'border-left-width',
    'border-right-style',
    'border-right-width',
    'border-style',
    'border-top-style',
    'border-top-width',
    'border-width',
    'break-after',
    'break-before',
    'break-inside',
    'caption-side',
    'clear',
    'clip-path',
    'color-scheme',
    'column-span',
    'columns',
    'contain',
    'container-name',
    'content',
    'box-sizing',
    'counter-increment',
    'counter-reset',
    'counter-set',
    'cursor',
    'direction',
    'display',
    'field-sizing',
    'flex',
    'float',
    'font-smooth',
    'font-stretch',
    'forced-color-adjust',
    'grid',
    'grid-area',
    'grid-auto-columns',
    'grid-auto-flow',
    'grid-auto-rows',
    'grid-column',
    'grid-column-end',
    'grid-column-start',
    'grid-row',
    'grid-row-end',
    'grid-row-start',
    'grid-template',
    'grid-template-areas',
    'hyphens',
    'isolation',
    'justify-content',
    'justify-items',
    'justify-self',
    'list-style',
    'mask-clip',
    'mask-composite',
    'mask-mode',
    'mask-origin',
    'mask-repeat',
    'mask-type',
    'mix-blend-mode',
    'opacity',
    'overflow',
    'overflow-block',
    'overflow-inline',
    'overflow-wrap',
    'overflow-x',
    'overflow-y',
    'overscroll-behavior',
    'overscroll-behavior-block',
    'overscroll-behavior-inline',
    'overscroll-behavior-x',
    'overscroll-behavior-y',
    'place-content',
    'place-items',
    'place-self',
    'pointer-events',
    'position',
    'quotes',
    'resize',
    'rotate',
    'rx',
    'ry',
    'scale',
    'scroll-behavior',
    'scroll-snap-type',
    'scrollbar-gutter',
    'scrollbar-width',
    'shape-outside',
    'shape-image-threshold',
    'stroke-dasharray',
    'tab-size',
    'table-layout',
    'text-overflow',
    'touch-action',
    'transform',
    'transition-behavior',
    'transition-property',
    'visibility',
    'vertical-align',
    'view-transition-class',
    'view-transition-name',
    'white-space',
    'will-change',
    'word-break',
    'writing-mode',
    'z-index',
    'zoom',
    '-webkit-text-stroke-width'
])
for (const namespace of defaultPlan.nativeValueNamespaces || []) {
    for (const property of namespace.properties) {
        nativeFallbackProperties.add(property)
    }
}

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
    return createCSS(defaultPlan, undefined, {
        nativeDeclarationMatcher: ({ property }) => nativeFallbackProperties.has(property)
    })
}

export function createPlanWithVariables(variables: MasterCSSPlanVariable[], basePlan = defaultPlan): MasterCSSPlan {
    const plan = clonePlan(basePlan)
    plan.variables = [
        ...(plan.variables || []),
        ...variables
    ]

    return plan
}

export function createCSSWithVariables(variables: MasterCSSPlanVariable[], basePlan = defaultPlan) {
    return createCSS(createPlanWithVariables(variables, basePlan))
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
