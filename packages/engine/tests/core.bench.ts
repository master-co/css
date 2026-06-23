import { bench, describe } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import UtilityType from '@master/css-schema/utility-type'
import { MasterCSS } from '../src'
import { compileManifest } from '../src/compile-manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
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

function createPatternBenchmarkManifest(separator: '-' | '_'): MasterCSSManifest {
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
        version: 1,
        settings: {
            modes: []
        },
        utilities
    }
}

const indexedPatternManifest = createPatternBenchmarkManifest('-')
const fallbackPatternManifest = createPatternBenchmarkManifest('_')
const indexedPatternClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}-left`)
const fallbackPatternClassNames = Array.from({ length: 100 }, (_, index) => `icon-${index}_left`)

describe('MasterCSS engine hot paths', () => {
    const hotCSS = MasterCSS.create({ manifest: defaultManifest, ...options })
    const indexedPatternCSS = MasterCSS.create({ manifest: indexedPatternManifest, ...options })
    const fallbackPatternCSS = MasterCSS.create({ manifest: fallbackPatternManifest, ...options })

    for (let index = 0; index < 10_000; index++) {
        hotCSS.createRule(runtimeClassNames[index % runtimeClassNames.length])
    }

    bench('create representative runtime classes', () => {
        let total = 0
        for (let index = 0; index < 10_000; index++) {
            const rule = hotCSS.createRule(runtimeClassNames[index % runtimeClassNames.length])
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

    bench('compile default manifest indexes', () => {
        const compiled = compileManifest(defaultManifest)
        sink = compiled.definedUtilities.length
    }, benchOptions)

    bench('create css with cached default manifest', () => {
        let total = 0
        for (let index = 0; index < 1_000; index++) {
            total += MasterCSS.create({ manifest: defaultManifest, ...options }).definedUtilities.length
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
            const css = MasterCSS.create({ manifest: defaultManifest, ...options })
            css.add(...runtimeClassNames)
            total += css.text.length
        }
        sink = total
    }, benchOptions)
})

void sink
