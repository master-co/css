import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'

describe('comp -> comp -> var', () => {
    const css = createCSS({
        components: { 'badge-primary': ['bg:primary fg:primary-text outline:1|primary-active'] },
        variables: [
            { key: 'primary', value: '$color-black', mode: 'light' },
            { key: 'primary-text', value: '$color-white', mode: 'light' },
            { key: 'primary-active', value: '$gray', mode: 'light' },
            { key: 'primary', value: '$color-white', mode: 'dark' },
            { key: 'primary-text', value: '$color-black', mode: 'dark' },
            { key: 'primary-active', value: '$color-white', mode: 'dark' }
        ],
        modes: ['light', 'dark']
    })
    css.add('badge-primary')
    test('badge with common strong comp', () => {
        expect(css.text).toMatchSnapshot()
    })
})

describe('extends', () => {
    const css = createCSS({ extends: [{ components: { a: ['order:1'] } }, { components: { b: ['order:2'] } }, { components: { c: ['order:3'] } }, { components: { a: ['order:11'] } }], components: { b: ['order:22'] } })
    test('a should be order:11', () => {
        expect(css.components.get('a')).toEqual({ classNames: ['order:11'], selectorRules: [] })
    })
    test('b should be order:22', () => {
        expect(css.components.get('b')).toEqual({ classNames: ['order:22'], selectorRules: [] })
    })
    test('c should be order:3', () => {
        expect(css.components.get('c')).toEqual({ classNames: ['order:3'], selectorRules: [] })
    })
})

describe('raw declarations', () => {
    test('rejects non-array component definitions', () => {
        expect(() => createCSS({ components: { btn: 'block' } as any })).toThrow('Component "btn" must be an array')
    })

    test('supports raw declarations from config components', () => {
        const css = createCSS({ components: { btn: ['px:4 font:semibold', { selector: '&', declarations: {
                        display: 'inline-flex'
                    } }] } })
        css.add('btn')
        expect(css.components.get('btn')).toEqual({
            classNames: ['px:4', 'font:semibold'],
            selectorRules: [{ selector: '&', declarations: { display: 'inline-flex' } }]
        })
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{font-weight:600}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('keeps component rules separate to preserve component order', () => {
        const css = createCSS()
        css.components.set('btn', {
            classNames: ['px:4', 'py:2', 'font:semibold'],
            selectorRules: [{ selector: '&', declarations: { display: 'inline-flex' } }]
        })
        css.add('btn')
        expect(css.componentsLayer.text.match(/\.btn\{/g)).toHaveLength(4)
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{padding-top:0.125rem;padding-bottom:0.125rem}')
        expect(css.componentsLayer.text).toContain('.btn{font-weight:600}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates component rule declarations', () => {
        const css = createCSS()
        css.components.set('btn', {
            classNames: ['px:4'],
            selectorRules: [{ selector: '&', declarations: { display: 'inline-flex' } }]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates component rule declarations with at-rules', () => {
        const css = createCSS({ atTokens: {
                sm: 500
            } })
        css.components.set('btn', {
            classNames: ['font:semibold'],
            selectorRules: [{ selector: '&', declarations: { display: 'inline-flex' } }]
        })
        css.add('btn@sm')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{font-weight:600}}')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{display:inline-flex}}')
    })

    test('keeps component rule declarations separate when variants differ', () => {
        const css = createCSS()
        css.components.set('btn', {
            classNames: ['block:hover'],
            selectorRules: [{ selector: '&', declarations: { display: 'inline-flex' } }]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
        expect(css.componentsLayer.text).toContain('.btn:hover{display:block}')
    })
})
