import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import defaultConfig from '../../src/config'

describe('issue #358: clamp() with bare arithmetic in middle arg', () => {
    test('font-size:clamp(1.5rem,2vw+1rem,2.25rem) auto-wraps the arithmetic arg in calc()', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(1.5rem,2vw+1rem,2.25rem)')
        expect(rule).toBeDefined()
        // calc() must have whitespace around + and - per CSS spec, otherwise the browser rejects it.
        expect(rule?.text).toMatch(/font-size:clamp\(1\.5rem,\s*calc\(2vw \+ 1rem\),\s*2\.25rem\)/)
    })

    test('clamp() handles whitespace in input correctly', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(1rem, 2vw + 1rem, 3rem)')
        expect(rule?.text).toMatch(/clamp\(\s*1rem\s*,\s*calc\(2vw\s*\+\s*1rem\)\s*,\s*3rem\s*\)/)
    })

    test('clamp() args that are already calc() are not double-wrapped', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(1rem,calc(2vw+1rem),3rem)')
        expect(rule?.text).toMatch(/clamp\(1rem,\s*calc\(2vw\s*\+\s*1rem\),\s*3rem\)/)
        expect(rule?.text).not.toContain('calc(calc(')
    })

    test('clamp() with negative leading values still parses correctly', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(-1rem,2vw,3rem)')
        // Single token with leading minus is a sign, not arithmetic — no calc wrapping.
        expect(rule?.text).toContain('clamp(-1rem, 2vw, 3rem)')
    })

    test('clamp() with calc() wrapper still works (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(1.5rem,calc(2vw+1rem),2.25rem)')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('font-size')
        expect(rule?.text).toContain('clamp(')
    })

    test('plain clamp() without arithmetic still works', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('font-size:clamp(1rem,2vw,3rem)')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('clamp(1rem, 2vw, 3rem)')
    })
})
