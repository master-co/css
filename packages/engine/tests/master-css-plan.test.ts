import { describe, expect, it } from 'vitest'
import UtilityType from 'shared/utility-type'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import createCSS from '../src/create'
import createRuntimeManifest from '../src/runtime-manifest'

describe.concurrent('MasterCSSPlan execution', () => {
    it('executes semantic enum pattern utilities after exact semantic utilities', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                modes: []
            },
            utilities: [
                {
                    id: 'text-<left|center>',
                    name: 'text-<left|center>',
                    type: UtilityType.Semantic,
                    order: 0,
                    emit: {
                        type: 'static',
                        rules: [{
                            declarations: {
                                'text-align': null
                            }
                        }]
                    },
                    matchers: [{
                        type: 'pattern',
                        prefix: 'text-',
                        values: ['left', 'center']
                    }]
                },
                {
                    id: '.text-center',
                    name: 'text-center',
                    type: UtilityType.Semantic,
                    order: 1,
                    emit: {
                        type: 'static',
                        rules: [{
                            declarations: {
                                'text-align': 'start'
                            }
                        }]
                    },
                    matchers: [{
                        type: 'static',
                        name: 'text-center'
                    }]
                }
            ],
            utilityBuckets: {
                pattern: [0],
                arbitrary: [1]
            }
        }
        const css = createCSS(plan)

        expect(css.create('text-left')?.text).toBe('.text-left{text-align:left}')
        expect(css.create('text-left')?.type).toBe(UtilityType.Semantic)
        expect(css.create('text-center')?.text).toBe('.text-center{text-align:start}')
    })

    it('tries raw managed utilities before key alias fallback', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                modes: []
            },
            variables: [
                { name: 'color-line', key: 'line', namespace: 'color', type: 'string', value: '#cccccc' }
            ],
            utilities: [
                {
                    id: 'b:<number>',
                    name: 'b:<number>',
                    type: UtilityType.Shorthand,
                    order: 1,
                    kind: 'number',
                    emit: {
                        type: 'static',
                        rules: [{
                            declarations: {
                                'border-width': null
                            }
                        }]
                    },
                    matchers: [{
                        type: 'value',
                        keys: ['b']
                    }]
                },
                {
                    id: 'b:<~color-line|~color|color>',
                    name: 'b:<~color-line|~color|color>',
                    type: UtilityType.Shorthand,
                    order: 0,
                    kind: 'color',
                    variableAliasRefs: ['~color-line', '~color'],
                    emit: {
                        type: 'static',
                        rules: [{
                            declarations: {
                                'border-color': null
                            }
                        }]
                    },
                    matchers: [
                        {
                            type: 'variable',
                            keys: ['b']
                        },
                        {
                            type: 'value',
                            keys: ['b']
                        }
                    ]
                }
            ],
            utilityBuckets: {
                variable: [1],
                value: [0, 1]
            }
        }
        const css = createCSS(plan)

        expect(css.create('b:1px')?.text).toBe('.b\\:1px{border-width:1px}')
        expect(css.create('b:line')?.text).toBe('.b\\:line{border-color:var(--color-line)}')
        expect(css.create('b:1px|solid|line')?.text).toBe('.b\\:1px\\|solid\\|line{border:1px solid var(--color-line)}')
    })

    it('executes pre-bucketed utility and variable aliases without config-style resolution', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: [
                {
                    name: 'spacing-card',
                    key: 'card',
                    namespace: 'spacing',
                    type: 'number',
                    value: 16
                }
            ],
            utilities: [
                {
                    id: 'margin',
                    name: 'margin',
                    type: UtilityType.Shorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    emit: { type: 'property', property: 'margin' },
                    matchers: [
                        { type: 'variable', keys: ['m'] },
                        { type: 'key', keys: ['m'] }
                    ],
                    variableAliases: [['card', 'spacing-card']]
                }
            ],
            utilityBuckets: {
                variable: [0],
                key: [0]
            }
        }

        expect(createCSS(plan).create('m:card')?.text)
            .toBe('.m\\:card{margin:var(--spacing-card)}')
    })

    it('resolves variable alias refs during plan loading without serialized namespaces', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: [
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 },
                { name: 'color-muted', key: 'muted', namespace: 'color', type: 'string', value: '#888888' },
                { name: 'color-text-muted', key: 'muted', namespace: 'color-text', type: 'string', value: '#777777' },
                { name: 'color-line-muted', key: 'muted', namespace: 'color-line', type: 'string', value: '#666666' },
                { name: 'radius-card', key: 'card', namespace: 'radius', type: 'number', value: 12 }
            ],
            utilities: [
                {
                    id: 'margin',
                    name: 'margin',
                    type: UtilityType.Shorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    variableAliasRefs: ['~spacing'],
                    emit: { type: 'property', property: 'margin' },
                    matchers: [{ type: 'variable', keys: ['m'] }]
                },
                {
                    id: 'color',
                    name: 'color',
                    type: UtilityType.Normal,
                    order: 1,
                    key: 'fg',
                    keys: ['fg'],
                    variableAliasRefs: ['~color-text', '~color'],
                    emit: { type: 'property', property: 'color' },
                    matchers: [{ type: 'variable', keys: ['fg'] }]
                },
                {
                    id: 'border-color',
                    name: 'border-color',
                    type: UtilityType.Normal,
                    order: 2,
                    key: 'border',
                    keys: ['border'],
                    variableAliasRefs: ['~color-line', '~color'],
                    emit: { type: 'property', property: 'border-color' },
                    matchers: [{ type: 'variable', keys: ['border'] }]
                },
                {
                    id: 'border-radius',
                    name: 'border-radius',
                    type: UtilityType.Normal,
                    order: 3,
                    key: 'r',
                    keys: ['r'],
                    variableAliasRefs: ['~radius'],
                    emit: { type: 'property', property: 'border-radius' },
                    matchers: [{ type: 'variable', keys: ['r'] }]
                }
            ],
            utilityBuckets: {
                variable: [0, 1, 2, 3]
            }
        }
        const css = createCSS(plan)

        expect(css.create('m:card')?.text)
            .toBe('.m\\:card{margin:var(--spacing-card)}')
        expect(css.create('fg:muted')?.text)
            .toBe('.fg\\:muted{color:var(--color-text-muted)}')
        expect(css.create('border:muted')?.text)
            .toBe('.border\\:muted{border-color:var(--color-line-muted)}')
        expect(css.create('r:card')?.text)
            .toBe('.r\\:card{border-radius:var(--radius-card)}')
    })

    it('reuses compiled plan data without sharing mutable instance state', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: [
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 }
            ],
            utilities: [
                {
                    id: 'margin',
                    name: 'margin',
                    type: UtilityType.Shorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    variableAliasRefs: ['~spacing'],
                    emit: { type: 'property', property: 'margin' },
                    matchers: [{ type: 'variable', keys: ['m'] }]
                }
            ],
            utilityBuckets: {
                variable: [0]
            }
        }
        const preloadedCSS = createCSS(plan, {
            variables: {
                'spacing-card': 1
            }
        })
        const css = createCSS(plan)

        preloadedCSS.add('m:card')
        expect(preloadedCSS.text).toBe('@layer utilities{.m\\:card{margin:var(--spacing-card)}}')
        expect(Object.fromEntries(preloadedCSS.themeLayer.tokenCounts)).toEqual({
            'spacing-card': 2
        })
        expect(css.text).toBe('')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({})

        css.add('m:card')
        expect(css.text).toBe('@layer theme{:root{--spacing-card:16}}@layer utilities{.m\\:card{margin:var(--spacing-card)}}')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toEqual({
            'spacing-card': 1
        })
    })

    it('keeps native declaration matcher behavior instance-local for cached plans', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                modes: []
            }
        }
        const acceptingCSS = createCSS(plan, undefined, {
            nativeDeclarationMatcher: ({ property }) => property === 'test-property'
        })
        const rejectingCSS = createCSS(plan, undefined, {
            nativeDeclarationMatcher: () => false
        })

        expect(acceptingCSS.create('test-property:value')?.text)
            .toBe('.test-property\\:value{test-property:value}')
        expect(rejectingCSS.create('test-property:value')).toBeUndefined()
    })

    it('ignores plan-carried registry fields', () => {
        const plan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: [
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 }
            ],
            keyAliases: {
                fakeAlias: 'color'
            },
            nativeValueNamespaces: [{
                properties: ['fake-property'],
                variableAliasRefs: ['~spacing']
            }]
        } as unknown as MasterCSSPlan
        const css = createCSS(plan)

        expect(css.create('fakeAlias:#fff')).toBeUndefined()
        expect(css.create('fake-property:card')).toBeUndefined()
        expect(css.create('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
    })

    it('rejects v2 plans instead of compatibility-loading them', () => {
        expect(() => createCSS({ version: 2 } as unknown as MasterCSSPlan))
            .toThrow('Unsupported MasterCSSPlan version. Expected version 3.')
    })

    it('uses compiled at-rule aliases from the plan', () => {
        const cardAtRule = {
            id: 'media',
            nodes: [{ type: 'number', name: 'width', operator: '>=', value: 48, unit: 'rem' }]
        } satisfies NonNullable<MasterCSSPlan['atRules']>[string]
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            atRules: {
                card: cardAtRule
            },
            breakpointAtRules: {
                card: cardAtRule
            },
            utilities: [
                {
                    id: 'margin',
                    name: 'margin',
                    type: UtilityType.Shorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    emit: { type: 'property', property: 'margin' },
                    matchers: [{ type: 'key', keys: ['m'] }]
                }
            ],
            utilityBuckets: {
                key: [0]
            }
        }

        expect(createCSS(plan).create('m:1rem@card')?.text)
            .toBe('@media (width>=48rem){.m\\:1rem\\@card{margin:1rem}}')
    })

    it('serializes generated runtime manifest rules in layer order', () => {
        const plan: MasterCSSPlan = {
            version: 3,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: [
                {
                    name: 'color-brand',
                    key: 'brand',
                    namespace: 'color',
                    type: 'string',
                    value: '#123456'
                }
            ],
            animations: {
                fade: {
                    from: { opacity: 0 },
                    to: { opacity: 1 }
                }
            },
            atRules: {
                card: {
                    id: 'media',
                    nodes: [{ type: 'number', name: 'width', operator: '>=', value: 48, unit: 'rem' }]
                }
            },
            utilities: [
                {
                    id: '.block',
                    name: 'block',
                    type: UtilityType.Semantic,
                    order: 0,
                    emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
                    matchers: [{ type: 'static', name: 'block' }]
                },
                {
                    id: 'color',
                    name: 'color',
                    type: UtilityType.Normal,
                    order: 1,
                    key: 'fg',
                    keys: ['fg'],
                    variableAliases: [['brand', 'color-brand']],
                    emit: { type: 'property', property: 'color' },
                    matchers: [{ type: 'variable', keys: ['fg'] }]
                },
                {
                    id: 'animation',
                    name: 'animation',
                    type: UtilityType.Normal,
                    order: 2,
                    key: 'animation',
                    keys: ['animation'],
                    emit: { type: 'property', property: 'animation' },
                    matchers: [{ type: 'key', keys: ['animation'] }]
                },
                {
                    id: '.multi',
                    name: 'multi',
                    type: UtilityType.Semantic,
                    order: 3,
                    emit: {
                        type: 'static',
                        rules: [
                            { declarations: { display: 'grid' } },
                            { selector: '&:hover', declarations: { color: 'red' } }
                        ]
                    },
                    matchers: [{ type: 'static', name: 'multi' }]
                }
            ],
            utilityBuckets: {
                arbitrary: [0, 3],
                variable: [1],
                key: [2]
            }
        }
        const css = createCSS(plan)
        css.add('block:hover@card', 'fg:brand', 'animation:fade|1s', 'multi')

        const manifest = createRuntimeManifest(css)

        expect(manifest.version).toBe(1)
        expect(manifest.rules.map((rule) => rule.className)).toEqual([
            'multi',
            'animation:fade|1s',
            'fg:brand',
            'block:hover@card'
        ])
        expect(manifest.rules.find((rule) => rule.className === 'block:hover@card')).toMatchObject({
            layer: 'utilities',
            sortTier: 3,
            priority: {
                features: [['width', 48, Number.MAX_SAFE_INTEGER]],
                selector: 1
            }
        })
        expect(manifest.rules.find((rule) => rule.className === 'fg:brand')?.variableNames).toEqual(['color-brand'])
        expect(manifest.rules.find((rule) => rule.className === 'animation:fade|1s')?.animationNames).toEqual(['fade'])
        expect(manifest.rules.find((rule) => rule.className === 'multi')?.nodes?.map((node) => node.text)).toEqual([
            '.multi{display:grid}',
            '.multi:hover{color:red}'
        ])
    })
})
