import { describe, expect, it, vi } from 'vitest'
import createCSSDirectiveConfig from '../../src/utils/create-config-from-css-directives'
import createConfigFromCSSDirectives from '../../src/create-config-from-css-directives'
import createCSSWithTheme, { createThemeConfig } from '../helpers/create-css-with-theme'
import {
    UtilityType,
    type CSSDirectiveResult
} from '../../src'
import { createCSSDirectiveAtRuleReference } from 'shared/css-directives'

function directiveResult(result: Partial<CSSDirectiveResult>): CSSDirectiveResult {
    return {
        config: {},
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

function getUtility(result: ReturnType<typeof createConfigFromCSSDirectives>, name: string, layer = 'components') {
    return result.config.utilities?.find((definition) =>
        definition.name === name
        && definition.type === UtilityType.Static
        && (definition.layer ?? 'utilities') === layer
    )
}

describe.concurrent('createConfigFromCSSDirectives', () => {
    it('keeps the internal adapter independent from the default config', () => {
        const result = createCSSDirectiveConfig(directiveResult({
            config: {
                atTokens: {
                    dark: 'media(prefers-color-scheme:dark)'
                }
            }
        }))

        expect(result.config.atTokens).toEqual({
            dark: 'media(prefers-color-scheme:dark)'
        })
    })

    it('finalizes self-contained @compose and @at directives without a base config', () => {
        const result = createCSSDirectiveConfig(directiveResult({
            config: {
                atTokens: {
                    wide: 'media(width>=64rem)'
                },
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
                    atRules: [createCSSDirectiveAtRuleReference('wide')]
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

    it('throws for unknown directive @at references', () => {
        expect(() => createConfigFromCSSDirectives(directiveResult({
            config: {
                utilities: [
                    {
                        name: 'chrisma-only',
                        type: 'static',
                        layer: 'utilities',
                        declarations: {
                            display: 'block'
                        },
                        atRules: [createCSSDirectiveAtRuleReference('chrisma')]
                    }
                ]
            }
        }))).toThrow('Unknown @at token: chrisma')
    })

    it('resolves raw variable names through derived namespaces by longest prefix', () => {
        const result = createConfigFromCSSDirectives(directiveResult({
            config: {
                variables: [
                    { name: 'color-line-lightest', value: '#eee' },
                    { name: 'color-text-strong', value: '#111' },
                    { name: 'color-blue-50', value: '#00f' }
                ]
            }
        }))

        expect(result.config.variables).toEqual([
            { namespace: 'color-line', key: 'lightest', value: '#eee' },
            { namespace: 'color-text', key: 'strong', value: '#111' },
            { namespace: 'color', key: 'blue-50', value: '#00f' }
        ])
    })

    it('does not resolve removed standalone namespaces from raw variable names', () => {
        const result = createConfigFromCSSDirectives(directiveResult({
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

    it('converts static directive utilities into core utilities and resolves @at references', () => {
        const result = createConfigFromCSSDirectives(directiveResult({
            config: {
                utilities: [
                    {
                        name: 'print-hidden',
                        type: 'static',
                        layer: 'utilities',
                        declarations: {
                            display: 'none'
                        },
                        atRules: [createCSSDirectiveAtRuleReference('print')]
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
        const result = createConfigFromCSSDirectives(directiveResult({
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
                    atRules: [createCSSDirectiveAtRuleReference('sm')]
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
        expect(() => createConfigFromCSSDirectives(directiveResult({
            config: {
                atTokens: {
                    dark: 'media(prefers-color-scheme:dark)'
                }
            }
        }), { config: createThemeConfig() })).toThrow('@custom-at "dark" conflicts with mode "dark"')

        expect(() => createConfigFromCSSDirectives(directiveResult({
            config: {
                variables: [
                    { name: 'breakpoint-md', value: 768, mode: 'compact' }
                ]
            }
        }), { config: createThemeConfig() })).toThrow('Breakpoint variables cannot be mode-specific: breakpoint-md@compact')

        expect(() => createConfigFromCSSDirectives(directiveResult({
            config: {
                variables: [
                    { name: 'container-md', value: 448, mode: 'compact' }
                ]
            }
        }), { config: createThemeConfig() })).toThrow('Container variables cannot be mode-specific: container-md@compact')

        const onWarning = vi.fn()
        const result = createConfigFromCSSDirectives(directiveResult({
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
