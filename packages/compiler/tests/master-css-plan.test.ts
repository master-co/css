import { describe, expect, it } from 'vitest'
import { createMasterCSSPlan } from '../src/master-css-plan'

describe.concurrent('createMasterCSSPlan', () => {
    it('lowers variables into resolved records with modes, dependencies, and negative aliases', () => {
        const plan = createMasterCSSPlan({
            variables: [
                { namespace: 'spacing', key: 'card', value: 12 },
                { namespace: 'color', key: 'brand', value: '$color-blue-50' },
                { namespace: 'color', key: 'brand', value: '#123', mode: 'dark' }
            ]
        })

        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'spacing-card',
            key: 'card',
            namespace: 'spacing',
            type: 'number',
            value: 12
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: '-spacing-card',
            key: '-card',
            namespace: 'spacing',
            type: 'number',
            value: -12
        }))
        expect(plan.variables).toContainEqual(expect.objectContaining({
            name: 'color-brand',
            key: 'brand',
            namespace: 'color',
            type: 'string',
            value: '$color-blue-50',
            modes: {
                dark: {
                    type: 'string',
                    value: '#123'
                }
            },
            dependencies: expect.arrayContaining(['color-blue-50'])
        }))
    })

    it('lowers breakpoint and container aliases into at-rule node maps', () => {
        const plan = createMasterCSSPlan({
            variables: [
                { namespace: 'breakpoint', key: 'card', value: 777 },
                { namespace: 'container', key: 'panel', value: 333 }
            ]
        })

        expect(plan.atRules?.card).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
        })
        expect(plan.breakpointAtRules?.card).toMatchObject({
            id: 'media',
            nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
        })
        expect(plan.containerAtRules?.panel).toMatchObject({
            id: 'container',
            nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
        })
    })

    it('lowers variants into compiled selector and at-rule branches', () => {
        const plan = createMasterCSSPlan({
            variants: [
                { token: ':hocus', branches: [{ selector: '&:hover,&:focus' }] },
                { token: '@motion-safe', branches: [{ atRules: ['@media (prefers-reduced-motion:no-preference)'] }] }
            ]
        })

        expect(plan.selectors?.[':hocus']).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: 'pseudo-class', value: 'hover' })
        ]))
        expect(plan.variants?.find((variant) => variant.token === ':hocus')?.branches[0].selectorNodes)
            .toEqual(expect.arrayContaining([
                expect.objectContaining({ type: 'pseudo-class', value: 'hover' })
            ]))
        expect(plan.variants?.find((variant) => variant.token === '@motion-safe')?.branches[0].atRuleNodes)
            .toEqual([
                expect.objectContaining({
                    id: 'media',
                    nodes: expect.arrayContaining([
                        expect.objectContaining({ type: 'string', name: 'prefers-reduced-motion' })
                    ])
                })
            ])
    })

    it('lowers CSS-defined static utilities and matcher buckets', () => {
        const plan = createMasterCSSPlan({
            utilities: [
                {
                    name: 'card',
                    layer: 'components',
                    declarations: {
                        display: 'grid',
                        color: 'var(--color-primary)'
                    }
                }
            ]
        })
        const index = plan.utilities?.findIndex((utility) => utility.name === 'card') ?? -1
        const utility = plan.utilities?.[index]

        expect(index).toBeGreaterThanOrEqual(0)
        expect(utility?.layer).toBe('components')
        expect(utility?.emit).toEqual({
            type: 'static',
            rules: [{
                declarations: {
                    display: 'grid',
                    color: 'var(--color-primary)'
                }
            }]
        })
        expect(utility?.matchers).toContainEqual({ type: 'static', name: 'card' })
        expect(plan.utilityBuckets?.arbitrary).toContain(index)
    })
})
