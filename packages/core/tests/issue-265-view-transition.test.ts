import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../src'

describe('issue #265: View Transitions API foundation', () => {
    test('view-transition-name applies as a CSS declaration', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('view-transition-name:hero')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-name:hero')
    })

    test('view-transition-class applies as a CSS declaration', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('view-transition-class:product-card')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('view-transition-class:product-card')
    })

    test('view-transition-name:none disables transition for the element', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('view-transition-name:none')
        expect(rule?.text).toContain('view-transition-name:none')
    })

    // Layer 2: pseudo-element selectors
    test('::view-transition pseudo-element passes through verbatim', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('opacity:0::view-transition')
        expect(rule?.text).toContain('::view-transition{opacity:0}')
    })

    test('::view-transition-old(name) parameterized pseudo emits both colons', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('opacity:0.5::view-transition-old(hero)')
        // regression for parse-selector::pre.lastIndexOf(':') previously
        // dropping the first colon of `::`
        expect(rule?.text).toContain('::view-transition-old(hero)')
        expect(rule?.text).not.toMatch(/[^:]:view-transition-old\(/)
    })

    test('::view-transition-new(name) emits both colons', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        expect(css.create('opacity:1::view-transition-new(hero)')?.text)
            .toContain('::view-transition-new(hero)')
    })

    test('::vt short alias maps to ::view-transition', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        expect(css.create('opacity:0::vt')?.text).toContain('::view-transition{opacity:0}')
    })

    test('::vt-old(name) short alias maps to ::view-transition-old(name)', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create('opacity:0.5::vt-old(hero)')
        expect(rule?.text).toContain('::view-transition-old(hero)')
    })

    test('::vt-new(name) short alias works', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        expect(css.create('opacity:1::vt-new(hero)')?.text)
            .toContain('::view-transition-new(hero)')
    })

    test('::vt-group(name) short alias works', () => {
        const css = new MasterCSS(undefined, defaultConfig)
        expect(css.create('animation:slide::vt-group(hero)')?.text)
            .toContain('::view-transition-group(hero)')
    })
})
