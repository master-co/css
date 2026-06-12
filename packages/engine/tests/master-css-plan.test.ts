import { describe, expect, it } from 'vitest'
import UtilityType from 'shared/utility-type'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import createCSS from '../src/create'

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
})
