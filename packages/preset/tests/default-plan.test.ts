import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileCSSPlanFile } from '@master/css-compiler'
import { createCSS } from '@master/css-engine'
import defaultPlan from '../src/default-plan'

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
    it('matches the CSS-authored preset plan facets', () => {
        const { plan } = compileCSSPlanFile(resolve(__dirname, '../src/index.css'))
        const compiledPlan = plan
        expect(compiledPlan.variables).toEqual(defaultPlan.variables)
        expect(compiledPlan.animations).toEqual(defaultPlan.animations)
        expect(stripRaw(compiledPlan.variants)).toEqual(stripRaw(defaultPlan.variants))
        expect(compiledPlan.atRules).toEqual(defaultPlan.atRules)
        expect(compiledPlan.breakpointAtRules).toEqual(defaultPlan.breakpointAtRules)
        expect(compiledPlan.containerAtRules).toEqual(defaultPlan.containerAtRules)
        expect(compiledPlan.selectors).toEqual(defaultPlan.selectors)
    })

    it('preserves the compiled dynamic registry', () => {
        const css = createCSS(defaultPlan)
        const text = [
            css.create('inline-flex')?.text,
            css.create('gradient(#000,#fff)')?.text,
            css.create('bg:red')?.text,
            css.create('grid-cols:3')?.text,
            css.create('lines:3')?.text,
            css.create('text:2xl')?.text
        ].join('')
        expect(text).toContain('display:inline-flex')
        expect(text).toContain('background-image:linear-gradient(#000,#fff)')
        expect(text).toContain('background-color:var(--color-red)')
        expect(text).toContain('grid-template-columns:repeat(3,minmax(0,1fr))')
        expect(text).toContain('-webkit-line-clamp:3')
        expect(text).not.toContain('null')
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
