import { describe, expect, it, vi } from 'vitest'
import {
    createConfigFromCSSDirectives,
    createCSS,
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

function getUtility(result: ReturnType<typeof createConfigFromCSSDirectives>, name: string, layer = 'main') {
    return result.config.utilities?.find((definition) =>
        definition.name === name
        && definition.type === UtilityType.Static
        && (definition.layer ?? 'general') === layer
    )
}

describe.concurrent('createConfigFromCSSDirectives', () => {
    it('resolves raw variable names through core namespaces by longest prefix', () => {
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

    it('converts static directive utilities into core utilities and resolves @at references', () => {
        const result = createConfigFromCSSDirectives(directiveResult({
            config: {
                utilities: [
                    {
                        name: 'print-hidden',
                        type: 'static',
                        layer: 'general',
                        declarations: {
                            display: 'none'
                        },
                        atRules: [createCSSDirectiveAtRuleReference('print')]
                    }
                ]
            }
        }))

        expect(getUtility(result, 'print-hidden', 'general')).toMatchObject({
            name: 'print-hidden',
            type: UtilityType.Static,
            layer: 'general',
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

    it('finalizes component definitions with core compose, mode, selector, and at-rule behavior', () => {
        const result = createConfigFromCSSDirectives(directiveResult({
            config: {
                modeTrigger: 'class',
                variables: [
                    { name: 'screen-sm', value: 640 },
                    { name: 'color-primary', value: '#123' }
                ],
                modes: ['dark']
            },
            componentDefinitions: {
                btn: [
                    {
                        type: 'compose',
                        order: 1,
                        className: 'block',
                        selector: '&'
                    },
                    {
                        type: 'compose',
                        order: 2,
                        className: 'bg:primary@dark',
                        selector: '&'
                    },
                    {
                        type: 'compose',
                        order: 3,
                        className: 'font:sm@sm',
                        selector: '&'
                    },
                    {
                        type: 'compose',
                        order: 4,
                        className: 'bg:green:hover',
                        selector: '&'
                    },
                    {
                        type: 'native',
                        order: 5,
                        selector: '&',
                        declarations: {
                            display: 'flex'
                        }
                    },
                    {
                        type: 'native',
                        order: 6,
                        selector: '&:hover',
                        declarations: {
                            color: '#fff'
                        }
                    }
                ]
            }
        }))

        expect(result.config.modes).toBeUndefined()
        expect(getUtility(result, 'btn')).toMatchObject({
            name: 'btn',
            type: UtilityType.Static,
            layer: 'main'
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
            }
        ])

        const css = createCSS(result.config).add('btn').text
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
        }))).toThrow('@custom-at "dark" conflicts with mode "dark"')

        expect(() => createConfigFromCSSDirectives(directiveResult({
            config: {
                variables: [
                    { name: 'screen-md', value: 768, mode: 'compact' }
                ]
            }
        }))).toThrow('Screen variables cannot be mode-specific: screen-md@compact')

        const onWarning = vi.fn()
        const result = createConfigFromCSSDirectives(directiveResult({
            config: {
                modes: ['chrisma']
            }
        }), { onWarning })

        expect(result.warnings).toEqual([
            'Custom mode "chrisma" will not work with mode-trigger: media. Browsers only support light and dark prefers-color-scheme values; use mode-trigger: class or host for custom modes.'
        ])
        expect(onWarning).toHaveBeenCalledWith(result.warnings[0])
    })
})
