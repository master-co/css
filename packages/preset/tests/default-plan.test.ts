import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCSS } from '@master/css-engine'
import UtilityType from 'shared/utility-type'
import { createDefaultPlanFromSourceFile } from '../scripts/generate-default-plan'
import defaultPlanJSON from '../src/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import functions from '../src/functions'
import keyAliases from '../src/key-aliases'
import nativeValueNamespaces from '../src/native-value-namespaces'
import sourceUtilities from '../src/utilities'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan
const __dirname = dirname(fileURLToPath(import.meta.url))

const retainedRadiusKeyAliases = {
    rb: 'border-bottom-radius',
    rbl: 'border-bottom-left-radius',
    rbr: 'border-bottom-right-radius',
    rl: 'border-left-radius',
    rr: 'border-right-radius',
    rt: 'border-top-radius',
    rtl: 'border-top-left-radius',
    rtr: 'border-top-right-radius'
}

function stripRaw<T>(value: T): T {
    if (Array.isArray(value)) return value.map(stripRaw) as T
    if (value && typeof value === 'object') {
        const next: Record<string, unknown> = {}
        for (const [key, child] of Object.entries(value)) {
            if (key === 'raw') continue
            next[key] = stripRaw(child)
        }
        return next as T
    }
    return value
}

const retainedMatcherAliases = new Set([
    'b',
    'bb',
    'bg',
    'bl',
    'br',
    'bt',
    'font',
    'grid-col',
    'grid-col-end',
    'grid-col-span',
    'grid-col-start',
    'grid-cols',
    'lines',
    'text'
])

const removedAliases = [
    'ac',
    'accent',
    'ai',
    'as',
    'aspect',
    'bd',
    'bg-blend',
    'bg-clip',
    'bg-origin',
    'blend',
    'box-decoration',
    'caret',
    'clip',
    'col-span',
    'cols',
    'd',
    'f',
    'font-feature',
    'grid-auto-cols',
    'grid-flow',
    'grid-template-cols',
    'jc',
    'ji',
    'js',
    'line-h',
    'ls',
    'o',
    'obj',
    's',
    'shape',
    'tab',
    't',
    'touch',
    'v',
    'vertical',
    'vt-class',
    'vt-name',
    'writing'
]

const competitiveNativeValueUtilities = [
    'container',
    'font',
    'stroke',
    'transform'
]

function collectMatcherKeys(plan: MasterCSSPlan) {
    const keys = new Set<string>()
    for (const utility of plan.utilities || []) {
        for (const matcher of utility.matchers || []) {
            if ('keys' in matcher) {
                matcher.keys.forEach((key) => keys.add(key))
            }
        }
    }
    return keys
}

describe('@master/css-preset defaultPlan', () => {
    it('matches the readable preset sources', () => {
        const plan = createDefaultPlanFromSourceFile(resolve(__dirname, '../src/index.css'))
        const utilities = plan.utilities || []

        expect(sourceUtilities).toHaveLength(128)
        expect(sourceUtilities.some((utility) => Number(utility.type) === UtilityType.Static)).toBe(false)
        expect(Object.keys(functions)).toHaveLength(49)
        expect(utilities).toHaveLength(323)
        expect(utilities[0]?.order).toBe(utilities.length - 1)
        expect(utilities[utilities.length - 1]?.order).toBe(0)
        expect(utilities.some((utility) => utility.matchers.some((matcher) => (matcher as { type: string }).type === 'function-prefix'))).toBe(false)
        expect(plan).toEqual(defaultPlan)
    }, 20000)

    it('matches the CSS-authored preset plan facets', () => {
        const compiledPlan = createDefaultPlanFromSourceFile(resolve(__dirname, '../src/index.css'))
        expect(compiledPlan.variables).toEqual(defaultPlan.variables)
        expect(compiledPlan.animations).toEqual(defaultPlan.animations)
        expect(stripRaw(compiledPlan.variants)).toEqual(stripRaw(defaultPlan.variants))
        expect(compiledPlan.atRules).toEqual(defaultPlan.atRules)
        expect(compiledPlan.breakpointAtRules).toEqual(defaultPlan.breakpointAtRules)
        expect(compiledPlan.containerAtRules).toEqual(defaultPlan.containerAtRules)
        expect(compiledPlan.selectors).toEqual(defaultPlan.selectors)
    }, 20000)

    it('preserves the compiled default registry', () => {
        const css = createCSS(defaultPlan)
        const text = [
            css.create('inline-flex')?.text,
            css.create('bg:linear-gradient(#000,#fff)')?.text,
            css.create('bg:accent')?.text,
            css.create('grid-cols:3')?.text,
            css.create('lines:3')?.text,
            css.create('text:2xl')?.text
        ].join('')
        expect(text).toContain('display:inline-flex')
        expect(text).toContain('background-image:linear-gradient(#000,#fff)')
        expect(text).toContain('background-color:var(--color-accent)')
        expect(text).toContain('grid-template-columns:repeat(3, minmax(0, 1fr))')
        expect(text).toContain('-webkit-line-clamp:3')
        expect(text).not.toContain('null')
        expect(css.create('gradient(#000,#fff)')).toBeUndefined()
    })

    it('executes CSS-authored static and enum pattern utilities', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('block')?.text).toBe('.block{display:block}')
        expect(css.create('bottom')?.text).toBe('.bottom{bottom:0}')
        expect(css.create('center')?.text).toBe('.center{left:0;right:0;margin-left:auto;margin-right:auto}')
        expect(css.create('rounded')?.text).toBe('.rounded{border-radius:1e9em}')
        expect(css.create('font-antialiased')?.text).toBe('.font-antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}')
        expect(css.create('text-center')?.text).toBe('.text-center{text-align:center}')
        expect(css.create('bg-cover')?.text).toBe('.bg-cover{background-size:cover}')
        expect(css.create('object-cover')?.text).toBe('.object-cover{object-fit:cover}')
        expect(css.create('b-solid')?.text).toBe('.b-solid{border-style:solid}')
        expect(css.create('b-groove')?.text).toBe('.b-groove{border-style:groove}')
        expect(css.create('bl-solid')?.text).toBe('.bl-solid{border-left-style:solid}')
        expect(css.create('bl-outset')?.text).toBe('.bl-outset{border-left-style:outset}')
        expect(css.create('bx-solid')?.text).toBe('.bx-solid{border-inline-style:solid}')
        expect(css.create('by-ridge')?.text).toBe('.by-ridge{border-block-style:ridge}')
        expect(css.create('font-sm')).toBeUndefined()
        expect(css.create('m-md')).toBeUndefined()
        expect(css.create('sr-only')?.text).toContain('position:absolute')
        expect(css.create('sr-only')?.text).toContain('clip:rect(0,0,0,0)')

        expect(defaultPlan.utilityBuckets?.pattern?.length).toBeGreaterThan(0)
        expect(defaultPlan.utilities?.some((utility) => utility.id === '.text-center')).toBe(false)
        expect(defaultPlan.utilities?.find((utility) => utility.id === 'text-<left,center,right,start,end,justify>'))
            .toMatchObject({
                matchers: [{
                    type: 'pattern',
                    prefix: 'text-',
                    values: ['left', 'center', 'right', 'start', 'end', 'justify']
                }]
            })
    })

    it('removes fixed keyword value aliases while preserving raw ambiguous matches', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('text:center')).toBeUndefined()
        expect(css.create('bg:cover')).toBeUndefined()
        expect(css.create('object:cover')).toBeUndefined()
        expect(css.create('border-solid')).toBeUndefined()
        expect(css.create('border-l-solid')).toBeUndefined()
        expect(css.create('bg:#fff')?.text).toBe('.bg\\:\\#fff{background-color:#fff}')
        expect(css.create('b:1')?.text).toBe('.b\\:1{border-width:1}')
        expect(css.create('font:sm')?.text).toBe('.font\\:sm{font-size:var(--font-size-sm)}')
        expect(css.create('font:16')?.text).toBe('.font\\:16{font-size:16}')
        expect(css.create('m:sm|md')?.text).toBe('.m\\:sm\\|md{margin:var(--spacing-sm) var(--spacing-md)}')
        expect(css.create('m:sm|-md')?.text).toBe('.m\\:sm\\|-md{margin:var(--spacing-sm) calc(var(--spacing-md) * -1)}')
        expect(css.create('text:2xl')?.text).toContain('font-size:var(--font-size-2xl)')

        for (const utility of defaultPlan.utilities || []) {
            expect('values' in utility, utility.id).toBe(false)
        }
        for (const index of defaultPlan.utilityBuckets?.value || []) {
            expect(defaultPlan.utilities?.[index]?.kind, defaultPlan.utilities?.[index]?.id).toBeDefined()
        }
    })

    it('prunes pure native coverage and keeps Master CSS native DX utilities', () => {
        const css = createCSS(defaultPlan)
        const nativeCSS = createCSS(defaultPlan, undefined, {
            nativeDeclarationMatcher: ({ property }) => property === 'perspective-origin'
                || property === 'scroll-margin-inline-start'
                || property === 'scroll-padding-block-end'
        })

        expect(css.create('float:left')).toBeUndefined()
        expect(css.create('field-sizing:content')).toBeUndefined()
        expect(css.create('caption-side:top')).toBeUndefined()
        expect(css.create('scrollbar-width:thin')).toBeUndefined()
        expect(css.create('transition-behavior:allow-discrete')).toBeUndefined()
        expect(css.create('display:block')).toBeUndefined()
        expect(css.create('d:block')).toBeUndefined()
        expect(css.create('view-transition-name:hero')).toBeUndefined()
        expect(css.create('vt-name:hero')).toBeUndefined()
        expect(nativeCSS.create('perspective-origin:100%|0')?.text).toBe('.perspective-origin\\:100\\%\\|0{perspective-origin:100% 0}')
        expect(nativeCSS.create('scroll-ms:1px')?.text).toBe('.scroll-ms\\:1px{scroll-margin-inline-start:1px}')
        expect(nativeCSS.create('scroll-pbe:1px')?.text).toBe('.scroll-pbe\\:1px{scroll-padding-block-end:1px}')
    })

    it('moves native value namespace utilities out of matcher definitions', () => {
        const matcherKeys = collectMatcherKeys(defaultPlan)
        const utilityIds = new Set((defaultPlan.utilities || []).map((utility) => utility.id))
        const nativeValueNamespaceProperties = nativeValueNamespaces.flatMap(({ properties }) => properties)

        expect(defaultPlan.nativeValueNamespaces).toEqual(nativeValueNamespaces)
        expect(new Set(nativeValueNamespaceProperties).size).toBe(nativeValueNamespaceProperties.length)
        expect(nativeValueNamespaceProperties).toHaveLength(109)
        for (const property of nativeValueNamespaceProperties) {
            expect(utilityIds.has(property), property).toBe(false)
            expect(matcherKeys.has(property), property).toBe(false)
        }
        for (const utility of competitiveNativeValueUtilities) {
            expect(utilityIds.has(utility), utility).toBe(true)
            expect(matcherKeys.has(utility), utility).toBe(true)
        }
    })

    it('keeps curated key aliases out of utility matcher keys', () => {
        const matcherKeys = collectMatcherKeys(defaultPlan)

        expect(defaultPlan.keyAliases).toEqual(keyAliases)
        expect(defaultPlan.keyAliases).toMatchObject(retainedRadiusKeyAliases)
        for (const alias of Object.keys(keyAliases)) {
            expect(matcherKeys.has(alias), alias).toBe(false)
        }
        for (const alias of retainedMatcherAliases) {
            expect(matcherKeys.has(alias), alias).toBe(true)
        }
        for (const alias of removedAliases) {
            expect(defaultPlan.keyAliases?.[alias], alias).toBeUndefined()
            expect(matcherKeys.has(alias), alias).toBe(false)
        }
    })

    it('keeps compiled utility registry indexes stable and addressable', () => {
        const utilities = defaultPlan.utilities || []
        const ids = new Map<string, number[]>()
        for (const [index, utility] of utilities.entries()) {
            expect(utility.matchers?.length).toBeGreaterThan(0)
            const id = utility.id || utility.name
            ids.set(id, [...(ids.get(id) || []), index])
        }

        expect([...ids].filter(([, indexes]) => indexes.length > 1)).toEqual([])

        for (const [bucketName, indexes] of Object.entries(defaultPlan.utilityBuckets || {})) {
            const bucketIndexes = indexes as number[]
            expect(bucketIndexes.length, bucketName).toBeGreaterThan(0)
            expect(new Set(bucketIndexes).size, bucketName).toBe(bucketIndexes.length)
            expect(bucketIndexes.every((index) => index >= 0 && index < utilities.length), bucketName).toBe(true)
        }
    })
})
