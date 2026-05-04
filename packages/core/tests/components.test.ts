import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'

describe('comp -> comp -> var', () => {
    const css = createCSS({
        components: {
            'badge-primary': 'strong-primary',
            'strong-primary': 'bg:primary fg:primary-text outline:1|primary-active'
        },
        modes: {
            light: {
                primary: '$color-black',
                'primary-text': '$color-white',
                'primary-active': '$gray',
            },
            dark: {
                primary: '$color-white',
                'primary-text': '$color-black',
                'primary-active': '$color-white',
            }
        }
    })
    css.add('badge-primary')
    test('badge with common strong comp', () => {
        expect(css.text).toMatchSnapshot()
    })
})

describe('extends', () => {
    const css = createCSS({
        extends: [
            { components: { a: 'order:1' } },
            { components: { b: 'order:2' } },
            { components: { c: 'order:3' } },
            { components: { a: 'order:11' } },
        ],
        components: {
            b: 'order:22'
        }
    })
    test('a should be order:11', () => {
        expect(css.components.get('a')).toEqual({ classNames: ['order:11'] })
    })
    test('b should be order:22', () => {
        expect(css.components.get('b')).toEqual({ classNames: ['order:22'] })
    })
    test('c should be order:3', () => {
        expect(css.components.get('c')).toEqual({ classNames: ['order:3'] })
    })
})

describe('raw declarations', () => {
    test('supports raw declarations from config components', () => {
        const css = createCSS({
            components: {
                btn: {
                    classNames: 'px:4 font:semibold',
                    declarations: {
                        display: 'inline-flex'
                    }
                }
            }
        })
        css.add('btn')
        expect(css.components.get('btn')).toEqual({
            classNames: ['px:4', 'font:semibold'],
            declarations: {
                display: 'inline-flex'
            }
        })
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{font-weight:600}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('keeps component rules separate to preserve component order', () => {
        const css = createCSS()
        css.components.set('btn', {
            classNames: ['px:4', 'py:2', 'font:semibold'],
            declarations: {
                display: 'inline-flex'
            }
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
            declarations: {
                display: 'inline-flex'
            }
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates component rule declarations with at-rules', () => {
        const css = createCSS({
            at: {
                sm: 500
            }
        })
        css.components.set('btn', {
            classNames: ['font:semibold'],
            declarations: {
                display: 'inline-flex'
            }
        })
        css.add('btn@sm')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{font-weight:600}}')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{display:inline-flex}}')
    })

    test('keeps component rule declarations separate when variants differ', () => {
        const css = createCSS()
        css.components.set('btn', {
            classNames: ['block:hover'],
            declarations: {
                display: 'inline-flex'
            }
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
        expect(css.componentsLayer.text).toContain('.btn:hover{display:block}')
    })
})
