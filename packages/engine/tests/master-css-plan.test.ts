import { describe, expect, it } from 'vitest'
import UtilityType from 'shared/utility-type'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import createCSS from '../src/create'
import createRuntimeManifest from '../src/runtime-manifest'

describe.concurrent('MasterCSSPlan execution', () => {
    it('executes pre-bucketed utility and variable aliases without config-style resolution', () => {
        const plan: MasterCSSPlan = {
            version: 1,
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
                    type: UtilityType.NativeShorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    unit: 'rem',
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
            .toBe('.m\\:card{margin:calc(var(--spacing-card) / 16 * 1rem)}')
    })

    it('uses compiled at-rule aliases from the plan', () => {
        const cardAtRule = {
            id: 'media',
            nodes: [{ type: 'number', name: 'width', operator: '>=', value: 48, unit: 'rem' }]
        } satisfies NonNullable<MasterCSSPlan['atRules']>[string]
        const plan: MasterCSSPlan = {
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
                    type: UtilityType.NativeShorthand,
                    order: 0,
                    key: 'm',
                    keys: ['m'],
                    unit: 'rem',
                    emit: { type: 'property', property: 'margin' },
                    matchers: [{ type: 'key', keys: ['m'] }]
                }
            ],
            utilityBuckets: {
                key: [0]
            }
        }

        expect(createCSS(plan).create('m:16@card')?.text)
            .toBe('@media (width>=48rem){.m\\:16\\@card{margin:1rem}}')
    })

    it('serializes generated runtime manifest rules in layer order', () => {
        const plan: MasterCSSPlan = {
            version: 1,
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
                    type: UtilityType.Static,
                    order: 0,
                    emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
                    matchers: [{ type: 'static', name: 'block' }]
                },
                {
                    id: 'color',
                    name: 'color',
                    type: UtilityType.Native,
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
                    type: UtilityType.Native,
                    order: 2,
                    key: 'animation',
                    keys: ['animation'],
                    includeAnimations: true,
                    emit: { type: 'property', property: 'animation' },
                    matchers: [{ type: 'key', keys: ['animation'] }]
                },
                {
                    id: '.multi',
                    name: 'multi',
                    type: UtilityType.Static,
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
