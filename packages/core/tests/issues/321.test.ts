import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import defaultConfig from '../../src/config'

describe('issue #321: translate / scale / rotate individual properties', () => {
    test('translate: as standalone property', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('translate:16')
        expect(rule?.text).toContain('translate:1rem')
    })

    test('translate: with two values', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('translate:16|24')
        expect(rule?.text).toContain('translate:1rem 1.5rem')
    })

    test('scale: as standalone property', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('scale:1.5')
        expect(rule?.text).toContain('scale:1.5')
    })

    test('scale: with two values', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('scale:1.5|2')
        expect(rule?.text).toContain('scale:1.5 2')
    })

    test('rotate: as standalone property', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('rotate:45deg')
        expect(rule?.text).toContain('rotate:45deg')
    })

    test('legacy translate() function still maps to transform (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('translate(16,16)')
        expect(rule?.text).toContain('transform:translate(1rem,1rem)')
    })

    test('legacy rotate() function still maps to transform (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('rotate(45deg)')
        expect(rule?.text).toContain('transform:rotate(45deg)')
    })
})
