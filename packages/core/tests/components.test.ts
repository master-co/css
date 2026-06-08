import { describe, expect, test } from 'vitest'
import { MasterCSS, UtilityType } from '../src'
import { extendConfig } from '../src/utils'
import createCSSWithTheme from './helpers/create-css-with-theme'

function component(name: string, rules: any[], layer: 'base' | 'defaults' | 'components' | 'utilities' = 'components') {
    return { name, type: UtilityType.Static, layer, rules }
}

describe('comp -> comp -> var', () => {
    const css = createCSSWithTheme({
        utilities: [
            component('badge-primary', [
                { selector: '&', declarations: { background: 'var(--primary)' } },
                { selector: '&', declarations: { outline: '0.0625rem var(--primary-active) solid' } },
                { selector: '&', declarations: { color: 'var(--primary-text)' } }
            ])
        ],
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

describe('extendConfig', () => {
    const css = createCSSWithTheme(extendConfig(
        { utilities: [component('a', [{ selector: '&', declarations: { order: '1' } }])] },
        { utilities: [component('b', [{ selector: '&', declarations: { order: '2' } }])] },
        { utilities: [component('c', [{ selector: '&', declarations: { order: '3' } }])] },
        { utilities: [component('a', [{ selector: '&', declarations: { order: '11' } }])] },
        { utilities: [component('b', [{ selector: '&', declarations: { order: '22' } }])] }
    ))
    test('a should be order:11', () => {
        expect(css.add('a').componentsLayer.text).toContain('.a{order:11}')
    })
    test('b should be order:22', () => {
        expect(css.add('b').componentsLayer.text).toContain('.b{order:22}')
    })
    test('c should be order:3', () => {
        expect(css.add('c').componentsLayer.text).toContain('.c{order:3}')
    })
})

describe('MasterCSS config', () => {
    const css = new MasterCSS(extendConfig(
        {
            utilities: [
                component('a', [{ selector: '&', declarations: { order: '1' } }]),
                component('b', [{ selector: '&', declarations: { order: '2' } }])
            ]
        },
        {
            utilities: [
                component('b', [{ selector: '&', declarations: { order: '22' } }]),
                component('c', [{ selector: '&', declarations: { order: '3' } }])
            ]
        }
    ))

    test('uses a single extended config constructor argument', () => {
        css.add('a', 'b', 'c')
        expect(css.componentsLayer.text).toContain('.a{order:1}')
        expect(css.componentsLayer.text).toContain('.b{order:22}')
        expect(css.componentsLayer.text).toContain('.c{order:3}')
    })
})

describe('raw declarations', () => {
    test('supports raw declarations from config components', () => {
        const css = createCSSWithTheme({ utilities: [component('btn', [{ selector: '&', declarations: {
                        'padding-left': '0.25rem',
                        'padding-right': '0.25rem'
                    } }, { selector: '&', declarations: {
                        'font-weight': '600'
                    } }, { selector: '&', declarations: {
                        display: 'inline-flex'
                    } }]) ] })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{font-weight:600}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('keeps component rules separate to preserve component order', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                { selector: '&', declarations: { 'padding-top': '0.125rem', 'padding-bottom': '0.125rem' } },
                { selector: '&', declarations: { 'font-weight': '600' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
                ])
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
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ])
            ]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates theme variables from raw component declarations with var fallbacks', () => {
        const css = createCSSWithTheme({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: {
                            background: 'var(--color-primary, transparent)'
                        }
                    }
                ])
            ]
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:#ff0}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:#000}}')
        expect(css.componentsLayer.text).toContain('.btn{background:var(--color-primary, transparent)}')
    })

    test('generates theme variables from static utility declarations', () => {
        const css = createCSSWithTheme({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            utilities: [
                {
                    name: 'surface',
                    type: UtilityType.Static,
                    layer: 'utilities',
                    declarations: {
                        background: 'var(--color-primary)'
                    }
                }
            ]
        }).add('surface')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:#ff0}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:#000}}')
        expect(css.utilitiesLayer.text).toContain('.surface{background:var(--color-primary)}')
    })

    test('generates and removes theme variables from animation keyframes', () => {
        const css = createCSSWithTheme({
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
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: {
                            animation: 'fade 1s'
                        }
                    }
                ])
            ]
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:#ff0}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:#000}}')
        expect(css.animationsNonLayer.text).toContain('@keyframes fade{to{background:var(--color-primary)}}')

        css.remove('btn')
        expect(css.themeLayer.text).toBe('')
        expect(css.animationsNonLayer.text).toBe('')
    })

    test('generates component rule declarations with at-rules', () => {
        const css = createCSSWithTheme({
            atTokens: {
                sm: 500
            },
            utilities: [
                component('btn', [
                    { selector: '&', declarations: { 'font-weight': '600' } },
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ])
            ]
        })
        css.add('btn@sm')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{font-weight:600}}')
        expect(css.componentsLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{display:inline-flex}}')
    })

    test('generates component rule declarations with selector variants', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:hover')

        expect(css.componentsLayer.text).toContain('.btn\\:hover:hover{display:block}')
    })

    test('places selector variants before configured component selectors', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    {
                        selector: '&:disabled>span',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:hover')

        expect(css.componentsLayer.text).toContain('.btn\\:hover:hover:disabled>span{display:block}')
        expect(css.componentsLayer.text).not.toContain('.btn\\:hover:disabled>span:hover')
    })

    test('combines component selector variants with at-rule variants', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ],
            variables: [
                { namespace: 'breakpoint', key: 'sm', value: 640 }
            ]
        }).add('btn:hover@sm')

        expect(css.componentsLayer.text).toContain('@media (width>=40rem){.btn\\:hover\\@sm:hover{display:block}}')
    })

    test('resolves selector tokens in component selector variants', () => {
        const css = createCSSWithTheme({
            selectorTokens: {
                ':interactive': ':is(:hover,:focus-visible)'
            },
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:interactive')

        expect(css.componentsLayer.text).toContain('.btn\\:interactive:is(:hover,:focus-visible){display:block}')
    })

    test('generates raw component declarations with configured at-rules', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    },
                    {
                        selector: '&',
                        atRules: ['@media print'],
                        declarations: { display: 'none' }
                    }
                ])
            ]
        }).add('btn')

        expect(css.componentsLayer.text).toContain('.btn{display:block}')
        expect(css.componentsLayer.text).toContain('@media print{.btn{display:none}}')
    })

    test('generates static utility rules with configured at-rules', () => {
        const css = createCSSWithTheme({
            utilities: [
                {
                    name: 'print-hidden',
                    type: UtilityType.Static,
                    layer: 'utilities',
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
        const css = createCSSWithTheme({
            utilities: [
                {
                    name: 'theme-hidden',
                    type: UtilityType.Static,
                    layer: 'utilities',
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
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    { selector: '&', declarations: { display: 'inline-flex' } },
                    { selector: '&:hover', declarations: { display: 'block' } }
                ])
            ]
        })
        css.add('btn')
        expect(css.componentsLayer.text).toContain('.btn{display:inline-flex}')
        expect(css.componentsLayer.text).toContain('.btn:hover{display:block}')
    })

    test('does not expand selector token prefixes inside native component selectors', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('code-line-add', [
                    {
                        selector: '&:not(:only-child):before',
                        declarations: { content: '\'+\'!important' }
                    }
                ])
            ]
        }).add('code-line-add')

        expect(css.componentsLayer.text).toContain('.code-line-add:not(:only-child):before{content:\'+\'!important}')
    })

    test('resolves selector token shorthands in component selectors', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('btn', [
                    {
                        selector: '&:only',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn')

        expect(css.componentsLayer.text).toContain('.btn:only-child{display:block}')
    })

    test('inserts component definitions into configured top-level layers', () => {
        const css = createCSSWithTheme({
            utilities: [
                component('prose', [
                    {
                        selector: '& :is(p)',
                        declarations: { 'font-size': '1rem' }
                    }
                ], 'defaults')
            ]
        }).add('prose')

        expect(css.defaultsLayer.text).toContain('@layer defaults{.prose :is(p){font-size:1rem}}')
        expect(css.componentsLayer.text).toBe('')
        expect(css.text).not.toContain('@layer components{@layer defaults')
    })
})
