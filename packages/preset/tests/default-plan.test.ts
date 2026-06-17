import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCSS } from '@master/css-engine'
import UtilityType from 'shared/utility-type'
import { createDefaultPlanFromSourceFile } from '../scripts/generate-default-plan'
import defaultPlan from '../src/default-plan'
import functions from '../src/functions'
import sourceUtilities from '../src/utilities'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

describe('@master/css-preset defaultPlan', () => {
    it('matches the readable preset sources', () => {
        const plan = createDefaultPlanFromSourceFile(resolve(__dirname, '../src/index.css'))
        const utilities = plan.utilities || []

        expect(sourceUtilities).toHaveLength(401)
        expect(sourceUtilities.some((utility) => Number(utility.type) === UtilityType.Static)).toBe(false)
        expect(Object.keys(functions)).toHaveLength(49)
        expect(utilities).toHaveLength(541)
        expect(utilities[0]?.order).toBe(utilities.length - 1)
        expect(utilities[utilities.length - 1]?.order).toBe(0)
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
            css.create('gradient(#000,#fff)')?.text,
            css.create('bg:accent')?.text,
            css.create('grid-cols:3')?.text,
            css.create('lines:3')?.text,
            css.create('text:2xl')?.text
        ].join('')
        expect(text).toContain('display:inline-flex')
        expect(text).toContain('background-image:linear-gradient(#000,#fff)')
        expect(text).toContain('background-color:var(--color-accent)')
        expect(text).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
        expect(text).toContain('-webkit-line-clamp:3')
        expect(text).not.toContain('null')
    })

    it('executes CSS-authored static utilities', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('block')?.text).toBe('.block{display:block}')
        expect(css.create('bottom')?.text).toBe('.bottom{bottom:0}')
        expect(css.create('center')?.text).toBe('.center{left:0;right:0;margin-left:auto;margin-right:auto}')
        expect(css.create('rounded')?.text).toBe('.rounded{border-radius:1e9em}')
        expect(css.create('font-antialiased')?.text).toBe('.font-antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}')
        expect(css.create('sr-only')?.text).toContain('position:absolute')
        expect(css.create('sr-only')?.text).toContain('clip:rect(0,0,0,0)')
    })

    it('executes native utilities added for CSS property coverage', () => {
        const css = createCSS(defaultPlan)

        expect(css.create('color-scheme:light|dark')?.text).toBe('.color-scheme\\:light\\|dark{color-scheme:light dark}')
        expect(css.create('field-sizing:content')?.text).toBe('.field-sizing\\:content{field-sizing:content}')
        expect(css.create('caption-side:top')?.text).toBe('.caption-side\\:top{caption-side:top}')
        expect(css.create('forced-color-adjust:none')?.text).toBe('.forced-color-adjust\\:none{forced-color-adjust:none}')
        expect(css.create('scrollbar-width:thin')?.text).toBe('.scrollbar-width\\:thin{scrollbar-width:thin}')
        expect(css.create('scrollbar-gutter:stable|both-edges')?.text).toBe('.scrollbar-gutter\\:stable\\|both-edges{scrollbar-gutter:stable both-edges}')
        expect(css.create('transition-behavior:allow-discrete')?.text).toBe('.transition-behavior\\:allow-discrete{transition-behavior:allow-discrete}')
        expect(css.create('backface-visibility:hidden')?.text).toBe('.backface-visibility\\:hidden{backface-visibility:hidden}')
        expect(css.create('perspective:none')?.text).toBe('.perspective\\:none{perspective:none}')
        expect(css.create('perspective-origin:100%|0')?.text).toBe('.perspective-origin\\:100\\%\\|0{perspective-origin:100% 0px}')
        expect(css.create('font-stretch:condensed')?.text).toBe('.font-stretch\\:condensed{font-stretch:condensed}')
        expect(css.create('mask-position:left|top')?.text).toBe('.mask-position\\:left\\|top{mask-position:left top}')
        expect(css.create('mask-clip:border-box')?.text).toBe('.mask-clip\\:border-box{mask-clip:border-box}')
        expect(css.create('mask-composite:add')?.text).toBe('.mask-composite\\:add{mask-composite:add}')
        expect(css.create('mask-type:alpha')?.text).toBe('.mask-type\\:alpha{mask-type:alpha}')
        expect(css.create('scroll-ms:1px')?.text).toBe('.scroll-ms\\:1px{scroll-margin-inline-start:1px}')
        expect(css.create('scroll-pbe:1px')?.text).toBe('.scroll-pbe\\:1px{scroll-padding-block-end:1px}')
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
