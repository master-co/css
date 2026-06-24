import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

describe('class inspection', () => {
    test('inspects key/value utilities with variants and token metadata', () => {
        const css = createDefaultCSS()
        const inspection = css.inspectClass('fg:red-60:hover@sm')

        expect(inspection).toMatchObject({
            className: 'fg:red-60:hover@sm',
            base: 'fg:red-60',
            suffix: ':hover@sm',
            key: 'fg',
            value: 'red-60',
            keyToken: 'fg:',
            valueToken: 'red-60',
            stateToken: ':hover@sm',
            matcherTypes: ['key']
        })
        expect(inspection.rules).toHaveLength(1)
        expect(inspection.variables.has('red-60')).toBe(true)
        expect(inspection.variableEntries.some(({ key }) => key === 'red-60')).toBe(true)
    })

    test('inspects static utilities and important suffixes', () => {
        const css = createDefaultCSS()

        expect(css.inspectClass('block:hover')).toMatchObject({
            base: 'block',
            suffix: ':hover',
            stateToken: ':hover'
        })
        expect(css.inspectClass('m:16px!@sm')).toMatchObject({
            base: 'm:16px',
            suffix: '!@sm',
            key: 'm',
            value: '16px',
            keyToken: 'm:',
            valueToken: '16px',
            stateToken: '@sm',
            important: true
        })
    })

    test('falls back to lexical class parts for unknown classes', () => {
        const css = createDefaultCSS()

        expect(css.inspectClass('unknown:1.5:hover')).toMatchObject({
            rules: [],
            base: 'unknown:1.5',
            suffix: ':hover',
            key: 'unknown',
            value: '1.5',
            matcherTypes: []
        })
    })

    test('normalizes number, rem, px, and base-unit numeric values', () => {
        const css = createDefaultCSS()

        expect(css.normalizeNumericValue(1)).toEqual({ kind: 'number', value: 1 })
        expect(css.normalizeNumericValue('1rem')).toEqual({ kind: 'rem', value: 1 })
        expect(css.normalizeNumericValue('16px')).toEqual({ kind: 'rem', value: 1 })
        expect(css.normalizeNumericValue('4x')).toEqual({
            kind: 'rem',
            value: 4 * css.settings.baseUnit / css.settings.rootSize
        })
        expect(css.normalizeNumericValue('50%')).toBeUndefined()
    })
})
