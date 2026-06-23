import { describe, expect, it } from 'vitest'
import UtilityType from 'shared/utility-type'
import type { MasterCSSManifest } from 'shared/master-css-manifest'
import { groupMasterCSSManifestVariables } from 'shared/master-css-manifest'
import { MasterCSS } from '../src'
import createHydrationManifest from '../src/hydration-manifest'

const variables = groupMasterCSSManifestVariables

describe.concurrent('MasterCSSManifest execution', () => {
    it('executes semantic enum pattern utilities after exact semantic utilities', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
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
            ]
        }
        const css = MasterCSS.create({ manifest: manifest })

        expect(css.createRule('text-left')?.text).toBe('.text-left{text-align:left}')
        expect(css.createRule('text-left')?.type).toBe(UtilityType.Semantic)
        expect(css.createRule('text-center')?.text).toBe('.text-center{text-align:start}')
    })

    it('keeps all matching exact semantic utilities when arbitrary utilities are indexed', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                modes: []
            },
            utilities: [
                {
                    id: '.btn-display',
                    name: 'btn',
                    type: UtilityType.Semantic,
                    order: 0,
                    emit: {
                        type: 'static',
                        rules: [{ declarations: { display: 'inline-flex' } }]
                    },
                    matchers: [{ type: 'static', name: 'btn' }]
                },
                {
                    id: '.btn-gap',
                    name: 'btn',
                    type: UtilityType.Semantic,
                    order: 1,
                    emit: {
                        type: 'static',
                        rules: [{ declarations: { gap: '0.5rem' } }]
                    },
                    matchers: [{ type: 'static', name: 'btn' }]
                }
            ]
        }

        expect(MasterCSS.create({ manifest: manifest }).createRules('btn').map(({ text }) => text)).toEqual([
            '.btn{display:inline-flex}',
            '.btn{gap:0.5rem}'
        ])
    })

    it('falls back to pattern scanning when pattern names cannot be safely indexed', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                modes: []
            },
            utilities: [
                {
                    id: 'icon_<left|right>',
                    name: 'icon_<left|right>',
                    type: UtilityType.Semantic,
                    order: 0,
                    emit: {
                        type: 'static',
                        rules: [{ declarations: { 'grid-area': null } }]
                    },
                    matchers: [{
                        type: 'pattern',
                        prefix: 'icon_',
                        values: ['left', 'right']
                    }]
                }
            ]
        }

        expect(MasterCSS.create({ manifest: manifest }).createRule('icon_left')?.text)
            .toBe('.icon_left{grid-area:left}')
    })

    it('tries raw managed utilities before key alias fallback', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                modes: []
            },
            variables: variables([
                { name: 'color-line', key: 'line', namespace: 'color', type: 'string', value: '#cccccc' }
            ]),
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
            ]
        }
        const css = MasterCSS.create({ manifest: manifest })

        expect(css.createRule('b:1px')?.text).toBe('.b\\:1px{border-width:1px}')
        expect(css.createRule('b:line')?.text).toBe('.b\\:line{border-color:var(--color-line)}')
        expect(css.createRule('b:1px|solid|line')?.text).toBe('.b\\:1px\\|solid\\|line{border:1px solid var(--color-line)}')
    })

    it('executes pre-bucketed utility and variable aliases without config-style resolution', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: variables([
                {
                    name: 'spacing-card',
                    key: 'card',
                    namespace: 'spacing',
                    type: 'number',
                    value: 16
                }
            ]),
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
            ]
        }

        expect(MasterCSS.create({ manifest: manifest }).createRule('m:card')?.text)
            .toBe('.m\\:card{margin:var(--spacing-card)}')
    })

    it('resolves variable alias refs during manifest loading without serialized namespaces', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: variables([
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 },
                { name: 'color-muted', key: 'muted', namespace: 'color', type: 'string', value: '#888888' },
                { name: 'color-text-muted', key: 'muted', namespace: 'color-text', type: 'string', value: '#777777' },
                { name: 'color-line-muted', key: 'muted', namespace: 'color-line', type: 'string', value: '#666666' },
                { name: 'radius-card', key: 'card', namespace: 'radius', type: 'number', value: 12 }
            ]),
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
            ]
        }
        const css = MasterCSS.create({ manifest: manifest })

        expect(css.createRule('m:card')?.text)
            .toBe('.m\\:card{margin:var(--spacing-card)}')
        expect(css.createRule('fg:muted')?.text)
            .toBe('.fg\\:muted{color:var(--color-text-muted)}')
        expect(css.createRule('border:muted')?.text)
            .toBe('.border\\:muted{border-color:var(--color-line-muted)}')
        expect(css.createRule('r:card')?.text)
            .toBe('.r\\:card{border-radius:var(--radius-card)}')
    })

    it('reuses compiled manifest data without sharing mutable instance state', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: variables([
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 }
            ]),
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
            ]
        }
        const emittedGlobalsCSS = MasterCSS.create({
            manifest,
            emittedGlobals: {
                variables: {
                    'spacing-card': 1
                }
            }
        })
        const css = MasterCSS.create({ manifest: manifest })

        emittedGlobalsCSS.add('m:card')
        expect(emittedGlobalsCSS.text).toBe('@layer utilities{.m\\:card{margin:var(--spacing-card)}}')
        expect(Object.fromEntries(emittedGlobalsCSS.themeLayer.tokenCounts)).toEqual({
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

    it('keeps native declaration matcher behavior instance-local for cached manifests', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                modes: []
            }
        }
        const acceptingCSS = MasterCSS.create({
            manifest,
            nativeDeclarationMatcher: ({ property }) => property === 'test-property'
        })
        const rejectingCSS = MasterCSS.create({
            manifest,
            nativeDeclarationMatcher: () => false
        })

        expect(acceptingCSS.createRule('test-property:value')?.text)
            .toBe('.test-property\\:value{test-property:value}')
        expect(rejectingCSS.createRule('test-property:value')).toBeUndefined()
    })

    it('ignores manifest-carried registry fields', () => {
        const manifest = {
            version: 1,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: variables([
                { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 }
            ]),
            keyAliases: {
                fakeAlias: 'color'
            },
            nativeValueNamespaces: [{
                properties: ['fake-property'],
                variableAliasRefs: ['~spacing']
            }]
        } as unknown as MasterCSSManifest
        const css = MasterCSS.create({ manifest: manifest })

        expect(css.createRule('fakeAlias:#fff')).toBeUndefined()
        expect(css.createRule('fake-property:card')).toBeUndefined()
        expect(css.createRule('m:card')?.text).toBe('.m\\:card{margin:var(--spacing-card)}')
    })

    it('rejects v2 manifests instead of compatibility-loading them', () => {
        expect(() => MasterCSS.create({ manifest: { version: 2 } as unknown as MasterCSSManifest }))
            .toThrow('Unsupported MasterCSSManifest version. Expected version 1.')
    })

    it('rejects stale flat v1 variable manifests instead of compatibility-loading them', () => {
        expect(() => MasterCSS.create({
            manifest: {
                version: 1,
                variables: [
                    { name: 'spacing-card', key: 'card', namespace: 'spacing', type: 'number', value: 16 }
                ]
            } as unknown as MasterCSSManifest
        })).toThrow('Unsupported MasterCSSManifest variables format. Expected namespace-grouped variables.')
    })

    it('rejects stale v1 utility bucket manifests instead of compatibility-loading them', () => {
        expect(() => MasterCSS.create({
            manifest: {
                version: 1,
                utilityBuckets: {}
            } as unknown as MasterCSSManifest
        })).toThrow('Unsupported MasterCSSManifest utilityBuckets field. Matcher indexes are engine-derived.')
    })

    it('uses compiled at-rule aliases from the manifest', () => {
        const cardAtRule = {
            id: 'media',
            nodes: [{ type: 'number', name: 'width', operator: '>=', value: 48, unit: 'rem' }]
        } satisfies NonNullable<MasterCSSManifest['atRules']>[string]
        const manifest: MasterCSSManifest = {
            version: 1,
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
            ]
        }

        expect(MasterCSS.create({ manifest: manifest }).createRule('m:1rem@card')?.text)
            .toBe('@media (width>=48rem){.m\\:1rem\\@card{margin:1rem}}')
    })

    it('serializes generated hydration manifest rules in layer order', () => {
        const manifest: MasterCSSManifest = {
            version: 1,
            settings: {
                rootSize: 16,
                modes: []
            },
            variables: variables([
                {
                    name: 'color-brand',
                    key: 'brand',
                    namespace: 'color',
                    type: 'string',
                    value: '#123456'
                }
            ]),
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
            ]
        }
        const css = MasterCSS.create({ manifest: manifest })
        css.add('block:hover@card', 'fg:brand', 'animation:fade|1s', 'multi')

        const hydrationManifest = createHydrationManifest(css)

        expect(hydrationManifest.version).toBe(1)
        expect(hydrationManifest.rules.map((rule) => rule.className)).toEqual([
            'multi',
            'animation:fade|1s',
            'fg:brand',
            'block:hover@card'
        ])
        expect(hydrationManifest.rules.find((rule) => rule.className === 'block:hover@card')).toMatchObject({
            layer: 'utilities',
            sortTier: 3,
            priority: {
                features: [['width', 48, Number.MAX_SAFE_INTEGER]],
                selector: 1
            }
        })
        expect(hydrationManifest.rules.find((rule) => rule.className === 'fg:brand')?.variableNames).toEqual(['color-brand'])
        expect(hydrationManifest.rules.find((rule) => rule.className === 'animation:fade|1s')?.animationNames).toEqual(['fade'])
        expect(hydrationManifest.rules.find((rule) => rule.className === 'multi')?.nodes?.map((node) => node.text)).toEqual([
            '.multi{display:grid}',
            '.multi:hover{color:red}'
        ])
    })
})
