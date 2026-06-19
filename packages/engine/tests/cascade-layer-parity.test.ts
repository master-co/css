import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import {
    clonePlan,
    createCSSWithStaticUtilities,
    createDefaultCSS,
    createPlanWithStaticUtilities,
    createPlanWithVariables,
    expectLayerText
} from './helpers/css-tester'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

describe.concurrent('migrated cascade and layer parity', () => {
    test('keeps on-demand insertion lifecycle for utilities variables and static components', () => {
        const css = createDefaultCSS()

        expect(css.text).toBe('')
        css.add('text-center')
        expect(css.text).toContain('@layer utilities{.text-center{text-align:center}}')
        css.remove('text-center')
        expect(css.text).toBe('')

        const componentCSS = createCSSWithStaticUtilities([
            {
                name: 'btn',
                rules: [{ declarations: { display: 'block' } }]
            }
        ])

        componentCSS.add('text-center', 'font:bold')
        expect(componentCSS.text).toContain('@layer theme{:root{--font-weight-bold:700}}')
        expect(componentCSS.text).toContain('@layer utilities{.font\\:bold{font-weight:var(--font-weight-bold)}.text-center{text-align:center}}')
        componentCSS.add('btn')
        expect(componentCSS.text).toContain('@layer components{.btn{display:block}}')
        componentCSS.remove('text-center', 'font:bold', 'btn')
        expect(componentCSS.text).toBe('')
    })

    test('prevents duplicate insertion and preserves preloaded variable and animation counts', () => {
        const css = createDefaultCSS()
        css.add('text-center', 'text-center')
        expect(css.utilitiesLayer.rules).toHaveLength(1)

        const preloadedVariableCSS = createCSS(defaultPlan, {
            variables: {
                'color-red-60': 1
            }
        })
        preloadedVariableCSS.add('bg:red-60')
        expect(preloadedVariableCSS.text).toBe('@layer utilities{.bg\\:red-60{background-color:var(--color-red-60)}}')
        expect(Object.fromEntries(preloadedVariableCSS.themeLayer.tokenCounts)).toMatchObject({
            'color-red-60': 2
        })
        preloadedVariableCSS.remove('bg:red-60')
        expect(preloadedVariableCSS.text).toBe('')
        expect(Object.fromEntries(preloadedVariableCSS.themeLayer.tokenCounts)).toMatchObject({
            'color-red-60': 1
        })

        const preloadedAnimationCSS = createCSS(defaultPlan, {
            animations: {
                fade: 1
            }
        })
        preloadedAnimationCSS.add('animate:fade')
        expect(preloadedAnimationCSS.text).toBe('@layer theme{:root{--animate-fade:fade 1s infinite}}@layer utilities{.animate\\:fade{animation:var(--animate-fade)}}')
        expect(Object.fromEntries(preloadedAnimationCSS.animationsNonLayer.tokenCounts)).toEqual({
            fade: 2
        })
        preloadedAnimationCSS.remove('animate:fade')
        expect(preloadedAnimationCSS.text).toBe('')
        expect(Object.fromEntries(preloadedAnimationCSS.animationsNonLayer.tokenCounts)).toEqual({
            fade: 1
        })
    })

    test('emits static variables, dependencies, aliases, and keyframes without class references', () => {
        const plan = createPlanWithVariables([
            {
                name: 'color-static-alias',
                key: 'static-alias',
                namespace: 'color',
                type: 'string',
                value: 'var(--color-static-base)',
                dependencies: ['color-static-base'],
                static: true
            },
            {
                name: 'color-static-base',
                key: 'static-base',
                namespace: 'color',
                type: 'string',
                value: '#123'
            },
            {
                name: 'spacing-card',
                key: 'card',
                namespace: 'spacing',
                type: 'number',
                value: 16,
                static: true
            },
            {
                name: '-spacing-card',
                key: '-card',
                namespace: 'spacing',
                type: 'number',
                value: -16,
                static: true
            }
        ])
        plan.animations = {
            ...(plan.animations || {}),
            'static-fade': {
                to: {
                    color: 'var(--color-static-base)'
                }
            }
        }
        plan.animationOptions = {
            'static-fade': {
                static: true
            }
        }
        const css = createCSS(plan)

        expect(css.text).toContain('@layer theme{')
        expect(css.text).toContain('--color-static-alias:var(--color-static-base)')
        expect(css.text).toContain('--color-static-base:#123')
        expect(css.text).toContain('--spacing-card:16')
        expect(css.text).toContain('---spacing-card:-16')
        expect(css.text).toContain('@keyframes static-fade{to{color:var(--color-static-base)}}')

        css.add('fg:static-alias')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
            'color-static-alias': 2,
            'color-static-base': 2
        })
        css.remove('fg:static-alias')
        expect(css.text).toContain('--color-static-alias:var(--color-static-base)')
        expect(css.text).toContain('--color-static-base:#123')
        expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
            'color-static-alias': 1,
            'color-static-base': 1
        })
    })

    test('does not duplicate preloaded static variables and keyframes', () => {
        const plan = createPlanWithVariables([
            {
                name: 'color-static-simple',
                key: 'static-simple',
                namespace: 'color',
                type: 'string',
                value: '#123',
                static: true
            }
        ])
        plan.animations = {
            ...(plan.animations || {}),
            'static-spin': {
                to: {
                    opacity: '1'
                }
            }
        }
        plan.animationOptions = {
            'static-spin': {
                static: true
            }
        }
        const css = createCSS(plan, {
            variables: {
                'color-static-simple': 1
            },
            animations: {
                'static-spin': 1
            }
        })

        expect(css.text).toBe('')
        css.add('fg:static-simple')
        expect(css.text).toBe('@layer utilities{.fg\\:static-simple{color:var(--color-static-simple)}}')
        css.remove('fg:static-simple')
        expect(css.text).toBe('')
    })

    test('emits referenced keyframes outside cascade layers', () => {
        const css = createDefaultCSS()

        css.add('animate:fade')
        expect(css.text).toBe([
            '@layer theme{:root{--animate-fade:fade 1s infinite}}',
            '@layer utilities{.animate\\:fade{animation:var(--animate-fade)}}',
            '@keyframes fade{0%{opacity:0}to{opacity:1}}'
        ].join(''))
    })

    test('routes explicit layer variants and rejects conflicting layer variants', () => {
        expectLayerText(createDefaultCSS(), 'block@base', 'baseLayer', '.block\\@base{display:block}')
        expectLayerText(createDefaultCSS(), 'block@default', 'defaultsLayer', '.block\\@default{display:block}')
        expectLayerText(createDefaultCSS(), 'block@component', 'componentsLayer', '.block\\@component{display:block}')
        expectLayerText(createDefaultCSS(), 'block@utility', 'utilitiesLayer', '.block\\@utility{display:block}')
        expectLayerText(createDefaultCSS(), 'block@base@sm', 'baseLayer', '@media (width>=52.125rem){.block\\@base\\@sm{display:block}}')
        expectLayerText(createDefaultCSS(), 'block@default@sm', 'defaultsLayer', '@media (width>=52.125rem){.block\\@default\\@sm{display:block}}')
        expectLayerText(createDefaultCSS(), 'font:.75rem_:is(code,pre)@base', 'baseLayer', '.font\\:\\.75rem_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}')
        expectLayerText(createDefaultCSS(), 'font:.75rem_:is(code,pre)@default', 'defaultsLayer', '.font\\:\\.75rem_\\:is\\(code\\,pre\\)\\@default :is(code,pre){font-size:0.75rem}')

        const conflicted = createDefaultCSS().add('block@base@default')
        expect(conflicted.text).not.toContain('block\\@base\\@default')
    })

    test('keeps at-rules authored on static component rules within the component layer', () => {
        const css = createCSS(createPlanWithStaticUtilities([
            {
                name: 'btn',
                rules: [
                    { selector: '&', atRules: ['@layer base'], declarations: { display: 'block' } }
                ]
            }
        ]))

        css.add('btn')
        expect(css.componentsLayer.text).toContain('@layer base{.btn{display:block}}')
    })

    test('keeps deterministic rule order independent of insertion order', () => {
        const inputs = [
            [
                'pi:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'padding-block:0',
                'mi:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'margin-block:0',
                'font:.75rem', 'font:medium', 'text-center', 'fixed', 'block', 'round', 'b:0'
            ],
            [
                'b:0', 'round', 'block', 'fixed', 'text-center', 'font:medium', 'font:.75rem',
                'margin-block:0', 'mb:0', 'mt:0', 'm:0', 'mr:0', 'ml:0', 'mi:0',
                'padding-block:0', 'pb:0', 'pt:0', 'p:0', 'pr:0', 'pl:0', 'pi:0'
            ]
        ]
        const expected = [
            'block', 'fixed', 'round', 'b:0', 'm:0', 'margin-block:0', 'mi:0', 'p:0', 'padding-block:0', 'pi:0',
            'font:.75rem', 'font:medium', 'mb:0', 'ml:0', 'mr:0', 'mt:0', 'pb:0', 'pl:0', 'pr:0', 'pt:0',
            'text-center'
        ]

        for (const input of inputs) {
            const css = createDefaultCSS()
            css.add(...input)
            expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual(expected)
        }
    })

    test('keeps declaration and media priority order', () => {
        const css = createDefaultCSS()
        css.add('font:.75rem', 'font:2rem@md', 'font:1.5rem@sm', 'm:8x', 'block', 'pi:4x', 'bg:blue-60:hover', 'round', 'mb:12x')
        expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
            'block',
            'round',
            'm:8x',
            'pi:4x',
            'font:.75rem',
            'mb:12x',
            'bg:blue-60:hover',
            'font:1.5rem@sm',
            'font:2rem@md'
        ])

        const tabletAtRule = { id: 'media' as const, nodes: [{ type: 'number' as const, value: 391 / 16, unit: 'rem' }] }
        const desktopAtRule = { id: 'media' as const, nodes: [{ type: 'number' as const, value: 1025 / 16, unit: 'rem' }] }
        const plan = clonePlan()
        plan.atRules = { ...(plan.atRules || {}), tablet: tabletAtRule, desktop: desktopAtRule }
        plan.breakpointAtRules = { ...(plan.breakpointAtRules || {}), tablet: tabletAtRule, desktop: desktopAtRule }
        const mediaCSS = createCSS(plan, undefined, {
            nativeDeclarationMatcher: ({ property }) => property === 'justify-content' || property === 'min-width'
        })
        mediaCSS.add('min-w:12.875rem', '{flex-row}@xs', 'justify-content:flex-end@xs', 'hidden@tablet&<desktop', '{flex-row}@2xs&<xs')
        expect(mediaCSS.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
            'min-w:12.875rem',
            '{flex-row}@xs',
            'justify-content:flex-end@xs',
            'hidden@tablet&<desktop',
            '{flex-row}@2xs&<xs'
        ])
    })

    test('keeps static component utility priority stable', () => {
        const css = createCSSWithStaticUtilities([
            {
                name: 'btn-primary',
                rules: [
                    { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } },
                    { selector: '&:hover', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } },
                    { selector: '&:disabled', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
                ]
            }
        ])

        css.add('btn-primary')
        expect(css.componentsLayer.rules.map(({ name }) => name)).toEqual(['btn-primary'])
        expect(css.componentsLayer.text).toContain('.btn-primary{background-color:oklch(63.7% 0.237 25.331)}')
        expect(css.componentsLayer.text).toContain('.btn-primary:hover{background-color:oklch(63.7% 0.237 25.331)}')
        expect(css.componentsLayer.text).toContain('.btn-primary:disabled{background-color:oklch(63.7% 0.237 25.331)}')
    })
})
