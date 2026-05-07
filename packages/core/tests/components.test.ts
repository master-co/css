import { describe, expect, test } from 'vitest'
import { createCSS, UtilityType } from '../src'

describe('comp -> comp -> var', () => {
    const css = createCSS({
        components: {
            'badge-primary': [
                { selector: '&', declarations: { background: 'var(--primary)' } },
                { selector: '&', declarations: { outline: '0.0625rem var(--primary-active) solid' } },
                { selector: '&', declarations: { color: 'var(--primary-text)' } }
            ]
        },
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
    const css = createCSS({
        extends: [
            { components: { a: [{ selector: '&', declarations: { order: '1' } }] } },
            { components: { b: [{ selector: '&', declarations: { order: '2' } }] } },
            { components: { c: [{ selector: '&', declarations: { order: '3' } }] } },
            { components: { a: [{ selector: '&', declarations: { order: '11' } }] } }
        ],
        components: { b: [{ selector: '&', declarations: { order: '22' } }] }
    })
    test('a should be order:11', () => {
        expect(css.components.get('a')).toEqual({ selectorRules: [{ selector: '&', declarations: { order: '11' } }] })
    })
    test('b should be order:22', () => {
        expect(css.components.get('b')).toEqual({ selectorRules: [{ selector: '&', declarations: { order: '22' } }] })
    })
    test('c should be order:3', () => {
        expect(css.components.get('c')).toEqual({ selectorRules: [{ selector: '&', declarations: { order: '3' } }] })
    })
})

describe('raw declarations', () => {
    test('rejects non-array component definitions', () => {
        expect(() => createCSS({ components: { btn: 'block' } as any })).toThrow('Component "btn" must be an array')
        expect(() => createCSS({ components: { btn: ['block'] } as any })).toThrow('Component "btn" definitions must be objects')
    })

    test('supports raw declarations from config components', () => {
        const css = createCSS({ components: { btn: [{ selector: '&', declarations: {
                        'padding-left': '0.25rem',
                        'padding-right': '0.25rem'
                    } }, { selector: '&', declarations: {
                        'font-weight': '600'
                    } }, { selector: '&', declarations: {
                        display: 'inline-flex'
                    } }] } })
        css.add('btn')
        expect(css.components.get('btn')).toEqual({
            selectorRules: [
                { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                { selector: '&', declarations: { 'font-weight': '600' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        })
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{font-weight:600}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('keeps component rules separate to preserve component order', () => {
        const css = createCSS()
        css.components.set('btn', {
            selectorRules: [
                { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                { selector: '&', declarations: { 'padding-top': '0.125rem', 'padding-bottom': '0.125rem' } },
                { selector: '&', declarations: { 'font-weight': '600' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
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
            selectorRules: [
                { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates theme variables from raw component declarations with var fallbacks', () => {
        const css = createCSS({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            background: 'var(--color-primary, transparent)'
                        }
                    }
                ]
            }
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.componentsLayer.text).toContain('.btn{background:var(--color-primary, transparent)}')
    })

    test('generates theme variables from static utility declarations', () => {
        const css = createCSS({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            utilities: [
                {
                    name: 'surface',
                    type: UtilityType.Static,
                    declarations: {
                        background: 'var(--color-primary)'
                    }
                }
            ]
        }).add('surface')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.utilitiesLayer.text).toContain('.surface{background:var(--color-primary)}')
    })

    test('generates and removes theme variables from animation keyframes', () => {
        const css = createCSS({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            animations: {
                fade: {
                    to: {
                        background: 'var(--color-primary)'
                    }
                }
            },
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: {
                            animation: 'fade 1s'
                        }
                    }
                ]
            }
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.animationsNonLayer.text).toContain('@keyframes fade{to{background:var(--color-primary)}}')

        css.remove('btn')
        expect(css.themeLayer.text).toBe('')
        expect(css.animationsNonLayer.text).toBe('')
    })

    test('generates component rule declarations with at-rules', () => {
        const css = createCSS({ atTokens: {
                sm: 500
            } })
        css.components.set('btn', {
            selectorRules: [
                { selector: '&', declarations: { 'font-weight': '600' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
            ]
        })
        css.add('btn@sm')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{font-weight:600}}')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{display:inline-flex}}')
    })

    test('generates raw component declarations with configured at-rules', () => {
        const css = createCSS({
            components: {
                btn: [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    },
                    {
                        selector: '&',
                        atRules: ['@media print'],
                        declarations: { display: 'none' }
                    }
                ]
            }
        }).add('btn')

        expect(css.componentsLayer.text).toContain('.btn{display:block}')
        expect(css.componentsLayer.text).toContain('@media print{.btn{display:none}}')
    })

    test('generates static utility rules with configured at-rules', () => {
        const css = createCSS({
            utilities: [
                {
                    name: 'print-hidden',
                    type: UtilityType.Static,
                    declarations: { display: 'block' },
                    rules: [
                        {
                            atRules: ['@media print'],
                            declarations: { display: 'none' }
                        }
                    ]
                }
            ]
        }).add('print-hidden')

        expect(css.utilitiesLayer.text).toContain('.print-hidden{display:block}')
        expect(css.utilitiesLayer.text).toContain('@media print{.print-hidden{display:none}}')
    })

    test('generates static utility rules with configured selectors', () => {
        const css = createCSS({
            utilities: [
                {
                    name: 'theme-hidden',
                    type: UtilityType.Static,
                    declarations: { display: 'block' },
                    rules: [
                        {
                            selector: '.dark &',
                            declarations: { display: 'none' }
                        }
                    ]
                }
            ]
        }).add('theme-hidden')

        expect(css.utilitiesLayer.text).toContain('.theme-hidden{display:block}')
        expect(css.utilitiesLayer.text).toContain('.dark .theme-hidden{display:none}')
    })

    test('keeps component rule declarations separate when variants differ', () => {
        const css = createCSS()
        css.components.set('btn', {
            selectorRules: [
                { selector: '&', declarations: { display: 'inline-flex' } },
                { selector: '&:hover', declarations: { display: 'block' } }
            ]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
        expect(css.componentsLayer.text).toContain('.btn:hover{display:block}')
    })

    test('does not expand selector token prefixes inside native component selectors', () => {
        const css = createCSS({
            components: {
                'code-line-add': [
                    {
                        selector: '&:not(:only-child):before',
                        declarations: { content: "'+'!important" }
                    }
                ]
            }
        }).add('code-line-add')

        expect(css.components.get('code-line-add')?.selectorRules[0].selector).toBe('&:not(:only-child):before')
        expect(css.componentsLayer.text).toContain(".code-line-add:not(:only-child):before{content:'+'!important}")
    })

    test('resolves selector token shorthands in component selectors', () => {
        const css = createCSS({
            components: {
                btn: [
                    {
                        selector: '&:only',
                        declarations: { display: 'block' }
                    }
                ]
            }
        }).add('btn')

        expect(css.components.get('btn')?.selectorRules[0].selector).toBe('&:only-child')
        expect(css.componentsLayer.text).toContain('.btn:only-child{display:block}')
    })

    test('inserts component definitions into configured top-level layers', () => {
        const css = createCSS({
            components: {
                prose: [
                    {
                        selector: '& :is(p)',
                        layer: 'preset',
                        declarations: { 'font-size': '1rem' }
                    }
                ]
            }
        }).add('prose')

        expect(css.presetLayer.text).toContain('@layer preset{.prose :is(p){font-size:1rem}}')
        expect(css.componentsLayer.text).toBe('')
        expect(css.text).not.toContain('@layer components{@layer preset')
    })
})
