import { test, expect } from '@playwright/test'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import initCSSRuntime from '../src/init'
import init from './init'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

test('destroy on progressive', async ({ page }) => {
    await init(page, '@layer utilities{}')
    await page.evaluate(() => {
        document.body.classList.add('text-center')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer.rules.length)).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || [])
        .filter(cssRule => cssRule === globalThis.cssRuntime.utilitiesLayer.native)
        .length
    )).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(1)
    await page.evaluate(() => {
        globalThis.cssRuntime.destroy()
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer.rules.length)).toBe(0)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(0)
    await page.evaluate(() => {
        globalThis.cssRuntime.observe()
        document.body.classList.add('block')
        document.body.classList.add('font:bold')
    })
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
})

test('prevent attach layer twice', async ({ page }) => {
    await init(page, '@layer components{}', {
        utilities: [
            {
                name: 'app-wrapper',
                type: -4,
                layer: 'components',
                rules: [
                    { selector: '&', declarations: { 'margin-left': 'auto', 'margin-right': 'auto' } },
                    { selector: '&', declarations: { 'padding-left': '1.25rem', 'padding-right': '1.25rem' } },
                    { selector: '&', declarations: { height: '2.5rem' } }
                ]
            }
        ]
    })
    await page.evaluate(() => {
        document.body.classList.add('app-wrapper')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.native?.cssRules?.length)).toBe(3)
})

test('insert static utility with multiple native rules into existing layer', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.evaluate(() => {
        document.body.innerHTML = '<div class="block multi-rule"></div>'
    })
    await init(page, '', {
        utilities: [
            {
                name: 'multi-rule',
                type: -4,
                rules: [
                    { selector: '&', declarations: { display: 'flex' } },
                    { selector: '&:hover', declarations: { color: 'red' } },
                    { selector: '&', atRules: ['@supports (appearance:none)'], declarations: { 'scrollbar-width': 'thin' } }
                ]
            }
        ]
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer.native?.cssRules.length)).toBe(4)
    expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('inserts functional pseudo-class selector variants into native CSSOM', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await page.evaluate(() => {
        document.body.innerHTML = '<div class="pb:8x:not(:last) text-center_td:not(:first)"></div>'
    })
    await init(page)

    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.utilitiesLayer.native?.cssRules || [])
        .map((cssRule) => cssRule.cssText)
    )).toEqual([
        '.text-center_td\\:not\\(\\:first\\) td:not(:first-child) { text-align: center; }',
        '.pb\\:8x\\:not\\(\\:last\\):not(:last-child) { padding-bottom: 2rem; }'
    ])
    expect(consoleErrors.find((message) => message.includes('insertRule'))).toBeUndefined()
})

test('refresh clears stale native keyframes', async ({ page }) => {
    await init(page)
    await page.evaluate(() => {
        document.body.classList.add('animation:fade|1s', 'animation:flash|1s')
    })
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style!.sheet!.cssRules)
        .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
        .map((cssRule) => (cssRule as CSSKeyframesRule).name)
    )).toEqual(['fade', 'flash'])

    await page.evaluate(() => {
        globalThis.cssRuntime.refresh()
    })
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style!.sheet!.cssRules)
        .filter((cssRule) => cssRule.constructor.name === 'CSSKeyframesRule')
        .map((cssRule) => (cssRule as CSSKeyframesRule).name)
    )).toEqual(['fade', 'flash'])
})

test('observes static theme variables and keyframes without class references', async ({ page }) => {
    await init(page, undefined, {
        variables: [
            {
                name: 'color-static',
                key: 'static',
                namespace: 'color',
                type: 'string',
                value: '#123',
                static: true
            }
        ],
        animations: {
            'static-fade': {
                to: {
                    opacity: '1'
                }
            }
        },
        animationOptions: {
            'static-fade': {
                static: true
            }
        }
    })

    const cssRules = await page.evaluate(() => Array.from(globalThis.cssRuntime.style!.sheet!.cssRules)
        .map((cssRule) => cssRule.cssText)
    )
    expect(cssRules.some((cssRule) => cssRule.includes('--color-static'))).toBe(true)
    expect(cssRules.some((cssRule) => cssRule.includes('@keyframes static-fade'))).toBe(true)
})

test('generates browser native declarations through CSS.supports fallback', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = [
            '<div class="float:left display:block field-sizing:content transition-behavior:allow-discrete color:oklch(63.7%|0.237|25.331)"></div>',
            '<div class="made-up:left float:banana display:banana"></div>'
        ].join('')
    })
    await init(page)

    const result = await page.evaluate(() => ({
        supports: {
            fieldSizing: CSS.supports('field-sizing', 'content'),
            transitionBehavior: CSS.supports('transition-behavior', 'allow-discrete')
        },
        classUtilities: [...globalThis.cssRuntime.classUtilities.keys()],
        cssRules: Array.from(globalThis.cssRuntime.utilitiesLayer.native?.cssRules || [])
            .map((cssRule) => cssRule.cssText)
    }))

    expect(result.classUtilities).toContain('float:left')
    expect(result.classUtilities).toContain('display:block')
    expect(result.classUtilities).toContain('color:oklch(63.7%|0.237|25.331)')
    expect(result.cssRules.some((cssRule) => cssRule.includes('float: left'))).toBe(true)
    expect(result.cssRules.some((cssRule) => cssRule.includes('display: block'))).toBe(true)
    expect(result.cssRules.some((cssRule) => cssRule.includes('oklch'))).toBe(true)

    if (result.supports.fieldSizing) {
        expect(result.classUtilities).toContain('field-sizing:content')
        expect(result.cssRules.some((cssRule) => cssRule.includes('field-sizing: content'))).toBe(true)
    }
    if (result.supports.transitionBehavior) {
        expect(result.classUtilities).toContain('transition-behavior:allow-discrete')
        expect(result.cssRules.some((cssRule) => cssRule.includes('transition-behavior: allow-discrete'))).toBe(true)
    }

    expect(result.classUtilities).not.toContain('made-up:left')
    expect(result.classUtilities).not.toContain('float:banana')
    expect(result.classUtilities).not.toContain('display:banana')
})

test('hydrates progressive static theme variables and keyframes', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = '<div class="block"></div>'
    })
    await init(page, [
        '@layer theme{:root{--color-static:#123}}',
        '@layer utilities{.block{display:block}}',
        '@keyframes static-fade{to{opacity:1}}'
    ].join(''), {
        variables: [
            {
                name: 'color-static',
                key: 'static',
                namespace: 'color',
                type: 'string',
                value: '#123',
                static: true
            }
        ],
        animations: {
            'static-fade': {
                to: {
                    opacity: '1'
                }
            }
        },
        animationOptions: {
            'static-fade': {
                static: true
            }
        }
    }, 'auto')

    expect(await page.evaluate(() => globalThis.cssRuntime.progressive)).toBe(true)
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.rules.map((rule) => rule.name))).toEqual(['color-static'])
    expect(await page.evaluate(() => globalThis.cssRuntime.animationsNonLayer.rules.map((rule) => rule.name))).toEqual(['static-fade'])
})

test('registers preloaded counts on an existing runtime', () => {
    const root = { host: {} } as unknown as ShadowRoot
    const cssRuntime = initCSSRuntime({ plan: defaultPlan, root, autoObserve: false })
    const returnedCSSRuntime = initCSSRuntime({
        plan: defaultPlan,
        root,
        autoObserve: false,
        preloaded: {
            variables: {
                'color-primary': 1
            },
            animations: {
                fade: 1
            }
        }
    })

    expect(returnedCSSRuntime).toBe(cssRuntime)
    expect(cssRuntime.preloaded.variables).toMatchObject({ 'color-primary': 1 })
    expect(cssRuntime.preloaded.animations).toMatchObject({ fade: 1 })
    expect(Object.fromEntries(cssRuntime.themeLayer.tokenCounts)).toMatchObject({ 'color-primary': 1 })
    expect(Object.fromEntries(cssRuntime.animationsNonLayer.tokenCounts)).toMatchObject({ fade: 1 })

    cssRuntime.destroy()
})
