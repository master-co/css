import { bench, describe } from 'vitest'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import UtilityType from 'shared/utility-type'
import { createCSS } from '../src'
import { compilePlan } from '../src/compile-plan'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const options = {
    nativeDeclarationMatcher: () => true
}

const runtimeClassNames = [
    'block',
    'text-center',
    'bg:red-60',
    'fg:primary',
    'm:4x',
    'pb:8x:not(:last)',
    'text-center_td:not(:first)',
    'w:calc(var(--h)|/|var(--w)*100%)',
    'grid-cols:3',
    'hidden@sm',
    'b:1px|solid|line',
    'font:.75rem',
    'round',
    'fixed',
    'animation:fade|1s',
    'translate:-md',
    'bg:linear-gradient(current,black)',
    'user-select:none',
    'width:4x',
    'flex@sm'
]

const benchOptions = {
    time: 500,
    warmupTime: 100
}

let sink = 0

function createPatternBenchmarkPlan(separator: '-' | '_'): MasterCSSPlan {
    const utilities = Array.from({ length: 100 }, (_, index) => ({
        id: `icon-${index}<left|right>`,
        name: `icon-${index}<left|right>`,
        type: UtilityType.Semantic,
        order: index,
        emit: {
            type: 'static',
            rules: [{
                declarations: {
                    'grid-area': null
                }
            }]
        },
        matchers: [{
            type: 'pattern',
            prefix: `icon-${index}${separator}`,
            values: ['left', 'right']
        }]
    }))

    return {
        version: 3,
        settings: {
            modes: []
        },
        utilities,
        utilityBuckets: {
            pattern: utilities.map((_, index) => index)
        }
    }
}

const indexedPatternPlan = createPatternBenchmarkPlan('-')
const fallbackPatternPlan = createPatternBenchmarkPlan('_')
const indexedPatternClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}-left`)
const fallbackPatternClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}_left`)

describe('MasterCSS engine hot paths', () => {
    const hotCSS = createCSS(defaultPlan, undefined, options)
    const indexedPatternCSS = createCSS(indexedPatternPlan, undefined, options)
    const fallbackPatternCSS = createCSS(fallbackPatternPlan, undefined, options)

    for (let index = 0; index < 10_000; index++) {
        hotCSS.create(runtimeClassNames[index % runtimeClassNames.length])
    }

    bench('create representative runtime classes', () => {
        let total = 0
        for (let index = 0; index < 10_000; index++) {
            const rule = hotCSS.create(runtimeClassNames[index % runtimeClassNames.length])
            if (rule) total += rule.text.length
        }
        sink = total
    }, benchOptions)

    bench('generate representative runtime classes', () => {
        let total = 0
        for (let index = 0; index < 5_000; index++) {
            total += hotCSS.generate(runtimeClassNames[index % runtimeClassNames.length]).length
        }
        sink = total
    }, benchOptions)

    bench('compile default plan indexes', () => {
        const compiled = compilePlan(defaultPlan)
        sink = compiled.definedUtilities.length
    }, benchOptions)

    bench('create css with cached default plan', () => {
        let total = 0
        for (let index = 0; index < 1_000; index++) {
            total += createCSS(defaultPlan, undefined, options).definedUtilities.length
        }
        sink = total
    }, benchOptions)

    bench('match indexed pattern utilities', () => {
        let total = 0
        for (let index = 0; index < 10_000; index++) {
            const utility = indexedPatternCSS.match(indexedPatternClassNames[index % indexedPatternClassNames.length])
            if (utility) total += utility.order
        }
        sink = total
    }, benchOptions)

    bench('match fallback pattern scan utilities', () => {
        let total = 0
        for (let index = 0; index < 10_000; index++) {
            const utility = fallbackPatternCSS.match(fallbackPatternClassNames[index % fallbackPatternClassNames.length])
            if (utility) total += utility.order
        }
        sink = total
    }, benchOptions)

    bench('create fresh css and add representative runtime classes', () => {
        let total = 0
        for (let index = 0; index < 100; index++) {
            const css = createCSS(defaultPlan, undefined, options)
            css.add(...runtimeClassNames)
            total += css.text.length
        }
        sink = total
    }, benchOptions)
})

void sink
