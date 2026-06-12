import { describe, expect, it, vi } from 'vitest'
import {
    createCSS,
    UtilityType,
    type Config
} from '@master/css'
import { extendConfig } from '@master/css/utils'
import {
    createCSSDirectiveVariantReference,
    type CSSDirectiveResult
} from 'shared/css-directives'
import { resolveCSSDirectiveConfig } from '../src'

const themeConfig: Config = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark'],
    variants: [
        { token: '@print', branches: [{ atRules: ['@media print'] }] }
    ],
    variables: [
        { namespace: 'breakpoint', key: 'sm', value: 640 },
        { namespace: 'font-size', key: 'sm', value: 14 },
        { namespace: 'color', key: 'primary', value: '#123' },
        { namespace: 'color', key: 'green', value: '#0f0' }
    ]
}

function createThemeConfig(config?: Config) {
    return extendConfig(themeConfig, config)
}

function createCSSWithTheme(config?: Config) {
    return createCSS(createThemeConfig(config))
}

function directiveResult(result: Partial<CSSDirectiveResult>): CSSDirectiveResult {
    return {
        config: {},
        extractionPolicy: {
            include: [],
            exclude: [],
            required: [],
            safelist: [],
            blocklist: [],
            preserveNative: false
        },
        classNames: [],
        nativeClassNames: [],
        nativeCSS: '',
        css: '',
        generatedCSS: '',
        warnings: [],
        dependencies: [],
        ...result
    }
}

function getUtility(result: ReturnType<typeof resolveCSSDirectiveConfig>, name: string, layer = 'components') {
    return result.config.utilities?.find((definition) =>
        definition.name === name
        && definition.type === UtilityType.Static
        && (definition.layer ?? 'utilities') === layer
    )
}

describe.concurrent('resolveCSSDirectiveConfig', () => {
    it('keeps the resolved config independent from the default config', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                variants: [{ token: '@contrast', branches: [{ atRules: ['@media (prefers-contrast:more)'] }] }]
            }
        }))

        expect(result.config.variants).toEqual([{ token: '@contrast', branches: [{ atRules: ['@media (prefers-contrast:more)'] }] }])
    })

    it('finalizes self-contained @compose and @variant directives without a base config', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                variants: [{ token: '@wide', branches: [{ atRules: ['@media (width>=64rem)'] }] }],
                utilities: [
                    {
                        name: 'inline',
                        type: 'static',
                        layer: 'utilities',
                        declarations: {
                            display: 'inline'
                        }
                    }
                ]
            },
            styleDefinitions: [
                {
                    type: 'compose',
                    order: 1,
                    name: 'badge',
                    className: 'inline',
                    selector: '&',
                    atRules: [createCSSDirectiveVariantReference('@wide')]
                }
            ]
        }))

        expect(getUtility(result, 'badge')?.rules).toEqual([
            {
                atRules: ['@media (width>=64rem)'],
                declarations: {
                    display: 'inline'
                }
            }
        ])
    })

    it('throws for unknown directive @variant references', () => {
        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                utilities: [
                    {
                        name: 'chrisma-only',
                        type: 'static',
                        layer: 'utilities',
                        declarations: {
                            display: 'block'
                        },
                        atRules: [createCSSDirectiveVariantReference('@chrisma')]
                    }
                ]
            }
        }))).toThrow('Unknown @variant token: @chrisma')
    })

    it('throws when variant tokens conflict with condition namespaces', () => {
        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [{ name: 'container-card', value: 320 }],
                variants: [{ token: '@card', branches: [{ atRules: ['@media (width>=20rem)'] }] }]
            }
        }))).toThrow('Variant "card" conflicts with container variable "--container-card"')
    })

    it('resolves raw variable names through derived namespaces by longest prefix', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'color-line-lightest', value: '#eee' },
                    { name: 'color-text-strong', value: '#111' },
                    { name: 'color-blue-50', value: '#00f' },
                    { name: 'tracking-tight', value: '-0.02em' },
                    { name: 'leading-body', value: 1.6 },
                    { name: 'radius-card', value: 12 }
                ]
            }
        }))

        expect(result.config.variables).toEqual([
            { namespace: 'color-line', key: 'lightest', value: '#eee' },
            { namespace: 'color-text', key: 'strong', value: '#111' },
            { namespace: 'color', key: 'blue-50', value: '#00f' },
            { namespace: 'tracking', key: 'tight', value: '-0.02em' },
            { namespace: 'leading', key: 'body', value: 1.6 },
            { namespace: 'radius', key: 'card', value: 12 }
        ])
    })

    it('preserves inline variable flags when resolving raw variable names', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'color-primary', value: '#123', inline: true }
                ]
            }
        }))

        expect(result.config.variables).toEqual([
            { namespace: 'color', key: 'primary', value: '#123', inline: true }
        ])
    })

    it('rejects mode-specific inline variables', () => {
        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'color-primary', value: '#123', mode: 'dark', inline: true }
                ]
            }
        }))).toThrow('Inline theme variables cannot be mode-specific: color-primary@dark')
    })

    it('does not resolve removed standalone namespaces from raw variable names', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'blur-sm', value: 8 },
                    { name: 'drop-shadow-soft', value: '0 2px 8px #000' },
                    { name: 'perspective-near', value: 800 },
                    { name: 'shadow-inset-sm', value: 'inset 0 1px 2px #000' }
                ]
            }
        }))

        expect(result.config.variables).toEqual([
            { key: 'blur-sm', value: 8 },
            { key: 'drop-shadow-soft', value: '0 2px 8px #000' },
            { key: 'perspective-near', value: 800 },
            { namespace: 'shadow', key: 'inset-sm', value: 'inset 0 1px 2px #000' }
        ])
    })

    it('converts static directive utilities into core utilities and resolves @variant references', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                utilities: [
                    {
                        name: 'print-hidden',
                        type: 'static',
                        layer: 'utilities',
                        declarations: {
                            display: 'none'
                        },
                        atRules: [createCSSDirectiveVariantReference('@print')]
                    }
                ]
            }
        }), { config: createThemeConfig() })

        expect(getUtility(result, 'print-hidden', 'utilities')).toMatchObject({
            name: 'print-hidden',
            type: UtilityType.Static,
            layer: 'utilities',
            unit: '',
            separators: [','],
            rules: [
                {
                    atRules: ['@media print'],
                    declarations: {
                        display: 'none'
                    }
                }
            ]
        })
    })

    it('finalizes style definitions with core compose, mode, selector, and at-rule behavior', () => {
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                modeTrigger: 'class',
                variables: [
                    { name: 'breakpoint-sm', value: 640 },
                    { name: 'color-primary', value: '#123' }
                ],
                modes: ['dark']
            },
            styleDefinitions: [
                {
                    type: 'compose',
                    order: 1,
                    name: 'btn',
                    className: 'block',
                    selector: '&'
                },
                {
                    type: 'compose',
                    order: 2,
                    name: 'btn',
                    className: 'bg:primary@dark',
                    selector: '&'
                },
                {
                    type: 'compose',
                    order: 3,
                    name: 'btn',
                    className: 'font:sm@sm',
                    selector: '&'
                },
                {
                    type: 'compose',
                    order: 4,
                    name: 'btn',
                    className: 'bg:green:hover',
                    selector: '&'
                },
                {
                    order: 5,
                    type: 'compose',
                    name: 'btn',
                    className: 'block',
                    selector: '& :is(h3)'
                },
                {
                    type: 'native',
                    order: 6,
                    name: 'btn',
                    selector: '&',
                    declarations: {
                        display: 'flex'
                    }
                },
                {
                    type: 'native',
                    order: 7,
                    name: 'btn',
                    selector: '&:hover',
                    declarations: {
                        color: '#fff'
                    }
                },
                {
                    type: 'compose',
                    order: 8,
                    name: 'btn',
                    className: 'block',
                    selector: '& .label',
                    atRules: [createCSSDirectiveVariantReference('@sm')]
                }
            ]
        }), { config: createThemeConfig() })

        expect(result.config.modes).toEqual(['dark'])
        expect(getUtility(result, 'btn')).toMatchObject({
            name: 'btn',
            type: UtilityType.Static,
            layer: 'components'
        })
        expect(getUtility(result, 'btn')?.rules).toEqual([
            {
                declarations: {
                    display: 'flex'
                }
            },
            {
                selector: '.dark &',
                declarations: {
                    'background-color': 'var(--color-primary)'
                }
            },
            {
                atRules: ['@media (width>=40rem)'],
                declarations: {
                    'font-size': 'calc(var(--font-size-sm) / 16 * 1rem)'
                }
            },
            {
                selector: '&:hover',
                declarations: {
                    'background-color': 'var(--color-green)',
                    color: '#fff'
                }
            },
            {
                selector: '& :is(h3)',
                declarations: {
                    display: 'block'
                }
            },
            {
                selector: '& .label',
                atRules: ['@media (width>=40rem)'],
                declarations: {
                    display: 'block'
                }
            }
        ])

        const css = createCSSWithTheme(result.config).add('btn').text
        expect(css).toContain('.btn{display:flex}')
        expect(css).toContain('.dark .btn{background-color:var(--color-primary)}')
        expect(css).toContain('@media (width>=40rem){.btn{font-size:calc(var(--font-size-sm) / 16 * 1rem)}}')
        expect(css).toContain('.btn:hover{background-color:var(--color-green);color:#fff}')
    })

    it('reports core token conflicts and media custom-mode warnings', () => {
        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                variants: [{ token: '@dark', branches: [{ atRules: ['@media (prefers-color-scheme:dark)'] }] }]
            }
        }), { config: createThemeConfig() })).toThrow('Variant "dark" conflicts with mode "dark"')

        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'breakpoint-md', value: 768, mode: 'compact' }
                ]
            }
        }), { config: createThemeConfig() })).toThrow('Breakpoint variables cannot be mode-specific: breakpoint-md@compact')

        expect(() => resolveCSSDirectiveConfig(directiveResult({
            config: {
                variables: [
                    { name: 'container-md', value: 448, mode: 'compact' }
                ]
            }
        }), { config: createThemeConfig() })).toThrow('Container variables cannot be mode-specific: container-md@compact')

        const onWarning = vi.fn()
        const result = resolveCSSDirectiveConfig(directiveResult({
            config: {
                modes: ['chrisma']
            }
        }), { config: createThemeConfig(), onWarning })

        expect(result.warnings).toEqual([
            'Custom mode "chrisma" will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.'
        ])
        expect(onWarning).toHaveBeenCalledWith(result.warnings[0])
    })
})
