import { test, expect } from '@playwright/test'
import { createCSS, createRuntimeManifest } from '@master/css'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'
import init from './init'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

test('disconnect clears counts and observe rescans the current DOM', async ({ page }) => {
    await init(page)
    await page.evaluate(async () => {
        document.body.innerHTML = '<div class="block"></div>'
        await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classCounts))).toEqual({
        block: 1
    })

    const disconnected = await page.evaluate(async () => {
        globalThis.cssRuntime.disconnect()
        document.body.innerHTML = '<div class="font:bold"></div>'
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            counts: Object.fromEntries(globalThis.cssRuntime.classCounts),
            hasStyle: !!document.head.querySelector('style#master')
        }
    })
    expect(disconnected).toEqual({
        counts: {},
        hasStyle: false
    })

    const reconnected = await page.evaluate(async () => {
        globalThis.cssRuntime.observe()
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            counts: Object.fromEntries(globalThis.cssRuntime.classCounts),
            text: globalThis.cssRuntime.text
        }
    })
    expect(reconnected.counts).toEqual({
        'font:bold': 1
    })
    expect(reconnected.text).toContain(':root{--font-weight-bold:700}')
    expect(reconnected.text).toContain('.font\\:bold{font-weight:var(--font-weight-bold)}')
    expect(reconnected.text).not.toContain('.block{display:block}')
})

test('shadow roots maintain isolated runtime state and style nodes', async ({ page }) => {
    await init(page)

    const result = await page.evaluate(() => {
        const host = document.createElement('section')
        const shadow = host.attachShadow({ mode: 'open' })
        shadow.innerHTML = '<p class="block"></p>'
        document.body.append(host)

        const shadowRuntime = new globalThis.CSSRuntime(shadow, globalThis.cssRuntime.plan).observe()

        return {
            documentCounts: Object.fromEntries(globalThis.cssRuntime.classCounts),
            documentHasBlockRule: globalThis.cssRuntime.text.includes('.block{display:block}'),
            shadowCounts: Object.fromEntries(shadowRuntime.classCounts),
            shadowHasStyle: !!shadow.querySelector('style#master'),
            shadowText: shadowRuntime.text,
            instanceRegistered: globalThis.CSSRuntime.instances.get(shadow) === shadowRuntime
        }
    })

    expect(result).toEqual({
        documentCounts: {},
        documentHasBlockRule: false,
        shadowCounts: { block: 1 },
        shadowHasStyle: true,
        shadowText: '@layer utilities{.block{display:block}}',
        instanceRegistered: true
    })
})

test('progressive hydration without a manifest rebuilds with runtime CSS', async ({ page }) => {
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<div class="block"></div>'
    })
    await init(page, '@layer utilities{.unknown{color:red}}')

    const result = await page.evaluate(() => ({
        progressive: globalThis.cssRuntime.progressive,
        ruleNames: globalThis.cssRuntime.utilitiesLayer.rules.map(({ name }) => name),
        nativeRules: Array.from(globalThis.cssRuntime.utilitiesLayer.native?.cssRules || []).map((rule) => rule.cssText),
        text: globalThis.cssRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('runtime manifest'))).toBe(true)
    expect(result.progressive).toBe(false)
    expect(result.ruleNames).toEqual(['block'])
    expect(result.nativeRules.some((text) => text.includes('.unknown'))).toBe(false)
    expect(result.nativeRules.some((text) => text.includes('.block'))).toBe(true)
    expect(result.text).toBe('@layer utilities{.block{display:block}}')
})

test('progressive hydration with a mismatched manifest rebuilds with runtime CSS', async ({ page }) => {
    const css = createCSS(defaultPlan)
    css.add('fg:red-60', 'bg:red-60')
    const manifest = createRuntimeManifest(css)
    const prerenderedCSS = createCSS(defaultPlan)
    prerenderedCSS.add('fg:red-60')
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="fg:red-60"></p>'
    })
    await init(page, prerenderedCSS.text, undefined, manifest)

    const result = await page.evaluate(() => ({
        progressive: globalThis.cssRuntime.progressive,
        text: globalThis.cssRuntime.text,
        utilityRules: globalThis.cssRuntime.utilitiesLayer.rules.map(({ name }) => name)
    }))

    expect(consoleWarnings.some((message) => message.includes('runtime manifest'))).toBe(true)
    expect(result.progressive).toBe(false)
    expect(result.utilityRules).toEqual(['fg:red-60'])
    expect(result.text).toContain('.fg\\:red-60')
    expect(result.text).not.toContain('.bg\\:red-60')
})

test('progressive hydration uses runtime manifest and removes hydrated classes', async ({ page }) => {
    const css = createCSS(defaultPlan)
    css.add('fg:red-60')
    const manifest = createRuntimeManifest(css)

    await page.evaluate(() => {
        document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    })
    await init(page, css.text, undefined, manifest)

    const hydrated = await page.evaluate(() => {
        const rule = globalThis.cssRuntime.utilitiesLayer.rules.find((eachRule) => eachRule.name === 'fg:red-60') as any
        return {
            hasClassUtility: globalThis.cssRuntime.classUtilities.has('fg:red-60'),
            hasRegisteredUtility: Boolean(rule?.registeredUtility),
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts),
            utilityRules: globalThis.cssRuntime.utilitiesLayer.rules.map(({ name }) => name)
        }
    })
    expect(hydrated).toEqual({
        hasClassUtility: true,
        hasRegisteredUtility: false,
        counts: {
            'color-red-60': 1
        },
        utilityRules: ['fg:red-60']
    })

    const removed = await page.evaluate(async () => {
        document.getElementById('target')?.classList.remove('fg:red-60')
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts),
            utilityRules: globalThis.cssRuntime.utilitiesLayer.rules.map(({ name }) => name)
        }
    })
    expect(removed).toEqual({
        text: '',
        counts: {},
        utilityRules: []
    })
})

test('progressive hydration matches bucketed theme variables', async ({ page }) => {
    const css = createCSS(defaultPlan)
    css.add('fg:red-60', 'bg:blue-60')
    const manifest = createRuntimeManifest(css)
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="fg:red-60 bg:blue-60"></p>'
    })
    await init(page, css.text, undefined, manifest)

    const result = await page.evaluate(() => ({
        progressive: globalThis.cssRuntime.progressive,
        counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts),
        nativeThemeRuleCount: globalThis.cssRuntime.themeLayer.native?.cssRules.length,
        text: globalThis.cssRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('runtime manifest'))).toBe(false)
    expect(result.progressive).toBe(true)
    expect(result.counts).toEqual({
        'color-red-60': 1,
        'color-blue-60': 1
    })
    expect(result.nativeThemeRuleCount).toBe(1)
    expect(result.text).toContain('--color-red-60')
    expect(result.text).toContain('--color-blue-60')
})

test('progressive hydration matches theme variable buckets by key', async ({ page }) => {
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="fg:primary"></p>'
    })
    await init(
        page,
        '@layer theme{.dark{--color-primary:#ffffff}.light,:root{--color-primary:#000000}}@layer utilities{.fg\\:primary{color:var(--color-primary)}}',
        {
            variables: [
                { namespace: 'color', key: 'primary', value: '#000000', mode: 'light' },
                { namespace: 'color', key: 'primary', value: '#ffffff', mode: 'dark' }
            ],
            modes: ['light', 'dark'],
            modeTrigger: 'class'
        },
        'auto'
    )

    const result = await page.evaluate(() => ({
        progressive: globalThis.cssRuntime.progressive,
        counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts),
        nativeThemeRuleCount: globalThis.cssRuntime.themeLayer.native?.cssRules.length,
        text: globalThis.cssRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('runtime manifest'))).toBe(false)
    expect(result.progressive).toBe(true)
    expect(result.counts).toEqual({
        'color-primary': 1
    })
    expect(result.nativeThemeRuleCount).toBe(2)
    expect(result.text).toContain('.light,:root{--color-primary:#000000}')
    expect(result.text).toContain('.dark{--color-primary:#ffffff}')
})

test('removes shared alias variable dependencies when classes disappear', async ({ page }) => {
    await init(page, '', {
        variables: [
            { key: 'surface', value: '#ffffff' },
            { key: 'brand', value: '$surface' }
        ]
    })

    const initial = await page.evaluate(async () => {
        const el = document.createElement('p')
        el.classList.add('fg:brand', 'color:brand')
        document.body.append(el)
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts)
        }
    })
    expect(initial).toEqual({
        text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
        counts: {
            brand: 2,
            surface: 2
        }
    })

    const afterOneRemoval = await page.evaluate(async () => {
        document.querySelector('p')?.classList.remove('fg:brand')
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts)
        }
    })
    expect(afterOneRemoval).toEqual({
        text: '@layer theme{:root{--brand:var(--surface);--surface:#ffffff}}',
        counts: {
            brand: 1,
            surface: 1
        }
    })

    const afterAllRemoved = await page.evaluate(async () => {
        document.querySelector('p')?.classList.remove('color:brand')
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts),
            nativeAttached: !!globalThis.cssRuntime.themeLayer.native?.parentStyleSheet
        }
    })
    expect(afterAllRemoved).toEqual({
        text: '',
        counts: {},
        nativeAttached: false
    })
})

test('inlines variables without runtime theme counts', async ({ page }) => {
    await init(page, '', {
        variables: [
            { namespace: 'color', key: 'brand', value: '#123456', inline: true }
        ]
    })

    const result = await page.evaluate(async () => {
        document.body.innerHTML = '<p class="fg:brand"></p>'
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts)
        }
    })

    expect(result).toEqual({
        text: '@layer utilities{.fg\\:brand{color:#123456}}',
        counts: {}
    })
})
