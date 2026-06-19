import { describe, expect, test } from 'vitest'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import { createCSS, previewCSS, type MasterCSS } from '../src'
import type { MasterCSSPlan } from 'shared/master-css-plan'
import {
    clonePlan,
    createDefaultCSS,
    createPlanWithSemanticUtilities,
    createPlanWithVariables
} from './helpers/css-tester'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

type CSSFactory = () => MasterCSS

function expectPreviewParity(classNames: string[], create: CSSFactory = createDefaultCSS) {
    const css = create()
    const expectedCSS = create()

    expectedCSS.add(...classNames)

    expect(previewCSS(css, classNames)).toBe(expectedCSS.text)
}

function getMapEntries(map: Map<string, number>) {
    return Array.from(map.entries())
}

function getLayerSnapshot(layer: Pick<MasterCSS['utilitiesLayer'], 'rules' | 'tokenCounts'>) {
    return {
        rules: layer.rules.map((rule) => rule.key),
        tokenCounts: getMapEntries(layer.tokenCounts)
    }
}

function snapshotCSS(css: MasterCSS) {
    return {
        text: css.text,
        classUtilities: Array.from(css.classUtilities.keys()),
        rules: css.rules.map((rule) => rule.name),
        themeLayer: getLayerSnapshot(css.themeLayer),
        baseLayer: getLayerSnapshot(css.baseLayer),
        defaultsLayer: getLayerSnapshot(css.defaultsLayer),
        componentsLayer: getLayerSnapshot(css.componentsLayer),
        utilitiesLayer: getLayerSnapshot(css.utilitiesLayer),
        animationsNonLayer: getLayerSnapshot(css.animationsNonLayer)
    }
}

function createCSSWithStaticResources() {
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
    return createCSS(plan)
}

describe.concurrent('previewCSS', () => {
    test.each([
        [['text-center', 'block', 'm:4x', 'font:bold', 'bg:black:hover@md&landscape']],
        [['{color:black!;bb:2px|solid}', '{content:\'\';block}::after@light']],
        [['animate:fade']]
    ])('matches normal insertion output for default utilities %#', (classNames) => {
        expectPreviewParity(classNames)
    })

    test('matches normal insertion output for native declarations', () => {
        const create = () => createCSS(defaultPlan, undefined, {
            nativeDeclarationMatcher: ({ property }) =>
                property === 'width'
                || property === 'padding-left'
                || property === 'justify-content'
        })

        expectPreviewParity(['width:4x', 'padding-left:1rem', 'justify-content:flex-end@xs'], create)
    })

    test('matches normal insertion output for semantic utilities and layers', () => {
        const plan = createPlanWithSemanticUtilities([
            {
                name: 'btn',
                rules: [
                    { declarations: { display: 'inline-flex' } },
                    { selector: '&:hover', declarations: { opacity: '.8' } }
                ]
            },
            {
                name: 'reset-button',
                layer: 'defaults',
                rules: [
                    { declarations: { appearance: 'none' } }
                ]
            }
        ])
        const create = () => createCSS(plan)

        expectPreviewParity(['btn', 'reset-button', 'block@base', 'block@utility'], create)
    })

    test('matches normal insertion output for custom at-rules and mode variables', () => {
        const plan = clonePlan()
        plan.atRules = {
            ...(plan.atRules || {}),
            'supports-backdrop': {
                id: 'supports',
                nodes: [
                    {
                        type: 'group',
                        children: [{ type: 'string', value: 'backdrop-filter:blur(0px)' }]
                    }
                ]
            }
        }
        plan.settings = {
            ...plan.settings,
            defaultMode: 'light',
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }
        plan.variables = [
            ...(plan.variables || []),
            {
                name: 'color-preview',
                key: 'preview',
                namespace: 'color',
                type: 'string',
                value: '#66f',
                modes: {
                    dark: { type: 'string', value: '#44f' }
                }
            }
        ]
        const create = () => createCSS(plan, undefined, {
            nativeDeclarationMatcher: ({ property }) => property === 'backdrop-filter'
        })

        expectPreviewParity(['fg:preview', 'backdrop-filter:blur(8px)@supports-backdrop', 'hidden@dark'], create)
    })

    test('matches normal insertion output for static resources', () => {
        expectPreviewParity(['fg:static-alias', 'm:card'], createCSSWithStaticResources)
    })

    test('matches normal insertion output with preloaded static resources', () => {
        const plan = createCSSWithStaticResources().plan
        const create = () => createCSS(plan, {
            variables: {
                'color-static-alias': 1,
                'color-static-base': 1
            },
            animations: {
                'static-fade': 1
            }
        })

        expectPreviewParity(['fg:static-alias'], create)
        expectPreviewParity([], create)
    })

    test('does not mutate the source CSS instance', () => {
        const css = createDefaultCSS()
        css.add('block', 'font:bold', 'animate:fade')
        const before = snapshotCSS(css)

        const output = previewCSS(css, [
            'text-center',
            'fg:blue-60',
            'animate:fade',
            '{content:\'\';block}::after@light'
        ])

        expect(output).toContain('@layer utilities')
        expect(snapshotCSS(css)).toEqual(before)
    })
})
