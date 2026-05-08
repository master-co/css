import { describe, expect, test } from 'vitest'
import { createCSS, extendConfig, MasterCSS, UtilityType } from '../src'

function mainStyle(name: string, rules: any[], layer: 'base' | 'preset' | 'main' | 'general' = 'main') {
    return { name, type: UtilityType.Static, layer, rules }
}

describe('comp -> comp -> var', () => {
    const css = createCSS({
        utilities: [
            mainStyle('badge-primary', [
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
    const css = createCSS(extendConfig(
        { utilities: [mainStyle('a', [{ selector: '&', declarations: { order: '1' } }])] },
        { utilities: [mainStyle('b', [{ selector: '&', declarations: { order: '2' } }])] },
        { utilities: [mainStyle('c', [{ selector: '&', declarations: { order: '3' } }])] },
        { utilities: [mainStyle('a', [{ selector: '&', declarations: { order: '11' } }])] },
        { utilities: [mainStyle('b', [{ selector: '&', declarations: { order: '22' } }])] }
    ))
    test('a should be order:11', () => {
        expect(css.add('a').mainLayer.text).toContain('.a{order:11}')
    })
    test('b should be order:22', () => {
        expect(css.add('b').mainLayer.text).toContain('.b{order:22}')
    })
    test('c should be order:3', () => {
        expect(css.add('c').mainLayer.text).toContain('.c{order:3}')
    })
})

describe('MasterCSS config arguments', () => {
    const css = new MasterCSS(
        {
            utilities: [
                mainStyle('a', [{ selector: '&', declarations: { order: '1' } }]),
                mainStyle('b', [{ selector: '&', declarations: { order: '2' } }])
            ]
        },
        {
            utilities: [
                mainStyle('b', [{ selector: '&', declarations: { order: '22' } }]),
                mainStyle('c', [{ selector: '&', declarations: { order: '3' } }])
            ]
        }
    )

    test('merges base and custom config constructor arguments', () => {
        css.add('a', 'b', 'c')
        expect(css.mainLayer.text).toContain('.a{order:1}')
        expect(css.mainLayer.text).toContain('.b{order:22}')
        expect(css.mainLayer.text).toContain('.c{order:3}')
    })
})

describe('raw declarations', () => {
    test('supports raw declarations from config main', () => {
        const css = createCSS({ utilities: [mainStyle('btn', [{ selector: '&', declarations: {
                        'padding-left': '0.25rem',
                        'padding-right': '0.25rem'
                    } }, { selector: '&', declarations: {
                        'font-weight': '600'
                    } }, { selector: '&', declarations: {
                        display: 'inline-flex'
                    } }]) ] })
        css.add('btn')
        expect(css.mainLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.mainLayer.text).toContain('.btn{font-weight:600}')
        expect(css.mainLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('keeps component rules separate to preserve component order', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                { selector: '&', declarations: { 'padding-top': '0.125rem', 'padding-bottom': '0.125rem' } },
                { selector: '&', declarations: { 'font-weight': '600' } },
                { selector: '&', declarations: { display: 'inline-flex' } }
                ])
            ]
        })
        css.add('btn')
        expect(css.mainLayer.text.match(/\.btn\{/g)).toHaveLength(4)
        expect(css.mainLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.mainLayer.text).toContain('.btn{padding-top:0.125rem;padding-bottom:0.125rem}')
        expect(css.mainLayer.text).toContain('.btn{font-weight:600}')
        expect(css.mainLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates component rule declarations', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    { selector: '&', declarations: { 'padding-left': '0.25rem', 'padding-right': '0.25rem' } },
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ])
            ]
        })
        css.add('btn')
        expect(css.mainLayer.text).toContain('.btn{padding-left:0.25rem;padding-right:0.25rem}')
        expect(css.mainLayer.text).toContain('.btn{display:inline-flex}')
    })

    test('generates theme variables from raw component declarations with var fallbacks', () => {
        const css = createCSS({
            variables: [
                { namespace: 'color', key: 'primary', value: '#ff0', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#000', mode: 'dark' }
            ],
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&',
                        declarations: {
                            background: 'var(--color-primary, transparent)'
                        }
                    }
                ])
            ]
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.mainLayer.text).toContain('.btn{background:var(--color-primary, transparent)}')
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
                    layer: 'general',
                    declarations: {
                        background: 'var(--color-primary)'
                    }
                }
            ]
        }).add('surface')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.generalLayer.text).toContain('.surface{background:var(--color-primary)}')
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
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&',
                        declarations: {
                            animation: 'fade 1s'
                        }
                    }
                ])
            ]
        }).add('btn')

        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:light){:root{--color-primary:rgb(255 255 0)}}')
        expect(css.themeLayer.text).toContain('@media (prefers-color-scheme:dark){:root{--color-primary:rgb(0 0 0)}}')
        expect(css.animationsNonLayer.text).toContain('@keyframes fade{to{background:var(--color-primary)}}')

        css.remove('btn')
        expect(css.themeLayer.text).toBe('')
        expect(css.animationsNonLayer.text).toBe('')
    })

    test('generates component rule declarations with at-rules', () => {
        const css = createCSS({
            atTokens: {
                sm: 500
            },
            utilities: [
                mainStyle('btn', [
                    { selector: '&', declarations: { 'font-weight': '600' } },
                    { selector: '&', declarations: { display: 'inline-flex' } }
                ])
            ]
        })
        css.add('btn@sm')
        expect(css.mainLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{font-weight:600}}')
        expect(css.mainLayer.text).toContain('@media (width>=31.25rem){.btn\\@sm{display:inline-flex}}')
    })

    test('generates component rule declarations with selector variants', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:hover')

        expect(css.mainLayer.text).toContain('.btn\\:hover:hover{display:block}')
    })

    test('places selector variants before configured component selectors', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&:disabled>span',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:hover')

        expect(css.mainLayer.text).toContain('.btn\\:hover:hover:disabled>span{display:block}')
        expect(css.mainLayer.text).not.toContain('.btn\\:hover:disabled>span:hover')
    })

    test('combines component selector variants with at-rule variants', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ],
            variables: [
                { namespace: 'screen', key: 'sm', value: 640 }
            ]
        }).add('btn:hover@sm')

        expect(css.mainLayer.text).toContain('@media (width>=40rem){.btn\\:hover\\@sm:hover{display:block}}')
    })

    test('resolves selector tokens in component selector variants', () => {
        const css = createCSS({
            selectorTokens: {
                ':interactive': ':is(:hover,:focus-visible)'
            },
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn:interactive')

        expect(css.mainLayer.text).toContain('.btn\\:interactive:is(:hover,:focus-visible){display:block}')
    })

    test('generates raw component declarations with configured at-rules', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
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

        expect(css.mainLayer.text).toContain('.btn{display:block}')
        expect(css.mainLayer.text).toContain('@media print{.btn{display:none}}')
    })

    test('generates static utility rules with configured at-rules', () => {
        const css = createCSS({
            utilities: [
                {
                    name: 'print-hidden',
                    type: UtilityType.Static,
                    layer: 'general',
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

        expect(css.generalLayer.text).toContain('.print-hidden{display:block}')
        expect(css.generalLayer.text).toContain('@media print{.print-hidden{display:none}}')
    })

    test('generates static utility rules with configured selectors', () => {
        const css = createCSS({
            utilities: [
                {
                    name: 'theme-hidden',
                    type: UtilityType.Static,
                    layer: 'general',
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

        expect(css.generalLayer.text).toContain('.theme-hidden{display:block}')
        expect(css.generalLayer.text).toContain('.dark .theme-hidden{display:none}')
    })

    test('keeps component rule declarations separate when variants differ', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    { selector: '&', declarations: { display: 'inline-flex' } },
                    { selector: '&:hover', declarations: { display: 'block' } }
                ])
            ]
        })
        css.add('btn')
        expect(css.mainLayer.text).toContain('.btn{display:inline-flex}')
        expect(css.mainLayer.text).toContain('.btn:hover{display:block}')
    })

    test('does not expand selector token prefixes inside native component selectors', () => {
        const css = createCSS({
            utilities: [
                mainStyle('code-line-add', [
                    {
                        selector: '&:not(:only-child):before',
                        declarations: { content: "'+'!important" }
                    }
                ])
            ]
        }).add('code-line-add')

        expect(css.mainLayer.text).toContain(".code-line-add:not(:only-child):before{content:'+'!important}")
    })

    test('resolves selector token shorthands in component selectors', () => {
        const css = createCSS({
            utilities: [
                mainStyle('btn', [
                    {
                        selector: '&:only',
                        declarations: { display: 'block' }
                    }
                ])
            ]
        }).add('btn')

        expect(css.mainLayer.text).toContain('.btn:only-child{display:block}')
    })

    test('inserts component definitions into configured top-level layers', () => {
        const css = createCSS({
            utilities: [
                mainStyle('prose', [
                    {
                        selector: '& :is(p)',
                        declarations: { 'font-size': '1rem' }
                    }
                ], 'preset')
            ]
        }).add('prose')

        expect(css.presetLayer.text).toContain('@layer preset{.prose :is(p){font-size:1rem}}')
        expect(css.mainLayer.text).toBe('')
        expect(css.text).not.toContain('@layer main{@layer preset')
    })
})
