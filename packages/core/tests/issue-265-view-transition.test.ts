import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../src'

describe('issue #265: View Transitions API foundation', () => {
    test('view-transition-name applies as a CSS declaration', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('view-transition-name:hero')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-name:hero')
    })

    test('view-transition-class applies as a CSS declaration', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('view-transition-class:product-card')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-class:product-card')
    })

    test('vt-name expands to view-transition-name declaration', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('vt-name:hero')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-name:hero')
    })

    test('vt-class expands to view-transition-class declaration', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('vt-class:product-card')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-class:product-card')
    })

    test('view-transition-name:none disables transition for the element', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('view-transition-name:none')
        expect(rule?.text).toContain('view-transition-name:none')
    })

    // Layer 2: pseudo-element selectors
    test('::view-transition pseudo-element passes through verbatim', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('opacity:0::view-transition')
        expect(rule?.text).toContain('::view-transition{opacity:0}')
    })

    test('::view-transition-old(name) parameterized pseudo emits both colons', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('opacity:0.5::view-transition-old(hero)')
        // regression for parse-selector::pre.lastIndexOf(':') previously
        // dropping the first colon of `::`
        expect(rule?.text).toContain('::view-transition-old(hero)')
        expect(rule?.text).not.toMatch(/[^:]:view-transition-old\(/)
    })

    test('::view-transition-new(name) emits both colons', () => {
        const css = new MasterCSS(defaultConfig)
        expect(css.create('opacity:1::view-transition-new(hero)')?.text)
            .toContain('::view-transition-new(hero)')
    })

    test.each([
        ['::vt', '::view-transition'],
        ['::vt-group(hero)', '::view-transition-group(hero)'],
        ['::vt-image-pair(hero)', '::view-transition-image-pair(hero)'],
        ['::vt-old(hero)', '::view-transition-old(hero)'],
        ['::vt-new(hero)', '::view-transition-new(hero)'],
    ])('%s shorthand selector expands to %s', (selector, expectedSelector) => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('opacity:0' + selector)
        expect(rule).toBeDefined()
        expect(rule?.text).toContain(expectedSelector + '{opacity:0}')
    })
})
