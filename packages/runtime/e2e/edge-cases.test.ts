import { test, expect, type Page } from '@playwright/test'
import { MasterCSS, createHydrationManifest } from '@master/css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
    MASTER_CSS_HYDRATION_MANIFEST_ATTR,
    serializeMasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import init, { getRuntimeLoaderURL } from './init'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

async function startCSSRuntimeAsync(
    page: Page,
    hydrationManifest?: ReturnType<typeof createHydrationManifest>,
    loaderURL?: string
) {
    await page.evaluate(async ({ loaderURL, hydrationManifest }) => {
        const { startCSSRuntimeAsync } = await import(loaderURL)
        await startCSSRuntimeAsync({ hydrationManifest })
    }, { loaderURL: loaderURL || await getRuntimeLoaderURL(), hydrationManifest })
    await page.waitForFunction(() => !!globalThis.masterCSSRuntime)
}

test('disconnect clears counts and observe rescans the current DOM', async ({ page }) => {
    await init(page)
    await page.evaluate(async () => {
        document.body.innerHTML = '<div class="block"></div>'
        await new Promise(resolve => setTimeout(resolve, 0))
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.masterCSSRuntime.classCounts))).toEqual({
        block: 1
    })

    const disconnected = await page.evaluate(async () => {
        globalThis.masterCSSRuntime.disconnect()
        document.body.innerHTML = '<div class="font:bold"></div>'
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
            hasStyle: !!document.head.querySelector('style#master-css')
        }
    })
    expect(disconnected).toEqual({
        counts: {},
        hasStyle: false
    })

    const reconnected = await page.evaluate(async () => {
        globalThis.masterCSSRuntime.observe()
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            counts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
            text: globalThis.masterCSSRuntime.text
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

        const shadowRuntime = globalThis.MasterCSSRuntime.create({
            root: shadow,
            manifest: globalThis.masterCSSRuntime.manifest
        }).observe()

        return {
            documentCounts: Object.fromEntries(globalThis.masterCSSRuntime.classCounts),
            documentHasBlockRule: globalThis.masterCSSRuntime.text.includes('.block{display:block}'),
            shadowCounts: Object.fromEntries(shadowRuntime.classCounts),
            shadowHasStyle: !!shadow.querySelector('style#master-css'),
            shadowText: shadowRuntime.text,
            instanceRegistered: globalThis.MasterCSSRuntime.instances.get(shadow) === shadowRuntime
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
        progressive: globalThis.masterCSSRuntime.progressive,
        ruleNames: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name),
        nativeRules: Array.from(globalThis.masterCSSRuntime.utilitiesLayer.native?.cssRules || []).map((rule) => rule.cssText),
        text: globalThis.masterCSSRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(true)
    expect(result.progressive).toBe(false)
    expect(result.ruleNames).toEqual(['block'])
    expect(result.nativeRules.some((text) => text.includes('.unknown'))).toBe(false)
    expect(result.nativeRules.some((text) => text.includes('.block'))).toBe(true)
    expect(result.text).toBe('@layer utilities{.block{display:block}}')
})

test('progressive hydration with a mismatched manifest rebuilds with runtime CSS', async ({ page }) => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    css.add('fg:red-60', 'bg:red-60')
    const hydrationManifest = createHydrationManifest(css)
    const prerenderedCSS = MasterCSS.create({ manifest: defaultManifest })
    prerenderedCSS.add('fg:red-60')
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="fg:red-60"></p>'
    })
    await init(page, prerenderedCSS.text, undefined, hydrationManifest)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        text: globalThis.masterCSSRuntime.text,
        utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name)
    }))

    expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(true)
    expect(result.progressive).toBe(false)
    expect(result.utilityRules).toEqual(['fg:red-60'])
    expect(result.text).toContain('.fg\\:red-60')
    expect(result.text).not.toContain('.bg\\:red-60')
})

test('progressive hydration with an empty manifest rebuilds with runtime CSS', async ({ page }) => {
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="block"></p>'
    })
    await init(page, '@layer utilities{.block{display:block}}', undefined, { version: 1, rules: [] })

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name),
        text: globalThis.masterCSSRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('Hydration manifest has no generated rules'))).toBe(true)
    expect(result).toEqual({
        progressive: false,
        utilityRules: ['block'],
        text: '@layer utilities{.block{display:block}}'
    })
})

test('progressive hydration uses hydration manifest and removes hydrated classes', async ({ page }) => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    css.add('fg:red-60')
    const hydrationManifest = createHydrationManifest(css)

    await page.evaluate(() => {
        document.body.innerHTML = '<p id="target" class="fg:red-60"></p>'
    })
    await init(page, css.text, undefined, hydrationManifest)

    const hydrated = await page.evaluate(() => {
        const rule = globalThis.masterCSSRuntime.utilitiesLayer.rules.find((eachRule) => eachRule.name === 'fg:red-60') as any
        return {
            hasClassUtility: globalThis.masterCSSRuntime.classUtilities.has('fg:red-60'),
            hasRegisteredUtility: Boolean(rule?.registeredUtility),
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
            utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name)
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
            text: globalThis.masterCSSRuntime.text,
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
            utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name)
        }
    })
    expect(removed).toEqual({
        text: '',
        counts: {},
        utilityRules: []
    })
})

test('progressive hydration fetches an external style hydration manifest', async ({ page }) => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    css.add('fg:red-60')
    const hydrationManifest = createHydrationManifest(css)
    const loaderURL = await getRuntimeLoaderURL()
    const source = new URL('/_master-css/hydration/external.json', loaderURL).href

    await page.route(source, route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: serializeMasterCSSHydrationManifest(hydrationManifest)
    }))
    await page.evaluate(({ attr, runtimeStyleId, source, text }) => {
        document.body.innerHTML = '<p class="fg:red-60"></p>'
        const style = document.createElement('style')
        style.id = runtimeStyleId
        style.textContent = text
        style.setAttribute(attr, source)
        document.head.append(style)
    }, {
        attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
        runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
        source,
        text: css.text
    })
    await startCSSRuntimeAsync(page, undefined, loaderURL)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name),
        text: globalThis.masterCSSRuntime.text
    }))

    expect(result.progressive).toBe(true)
    expect(result.utilityRules).toEqual(['fg:red-60'])
    expect(result.text).toContain('.fg\\:red-60')
})

test('runtime start does not fetch a hydration manifest without a runtime style source', async ({ page }) => {
    let requests = 0
    const loaderURL = await getRuntimeLoaderURL()
    const source = new URL('/_master-css/hydration/unreferenced.json', loaderURL).href

    await page.route(source, route => {
        requests++
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"version":1,"rules":[]}'
        })
    })
    await page.evaluate(() => {
        document.body.innerHTML = '<p class="block"></p>'
    })
    await startCSSRuntimeAsync(page, undefined, loaderURL)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        observing: globalThis.masterCSSRuntime.observing,
        text: globalThis.masterCSSRuntime.text
    }))

    expect(requests).toBe(0)
    expect(result).toEqual({
        progressive: false,
        observing: true,
        text: '@layer utilities{.block{display:block}}'
    })
})

test('progressive hydration falls back when an external style hydration manifest fetch fails', async ({ page }) => {
    const loaderURL = await getRuntimeLoaderURL()
    const source = new URL('/_master-css/hydration/missing.json', loaderURL).href

    await page.route(source, route => route.fulfill({
        status: 404,
        body: 'not found'
    }))
    await page.evaluate(({ attr, runtimeStyleId, source }) => {
        document.body.innerHTML = '<p class="block"></p>'
        const style = document.createElement('style')
        style.id = runtimeStyleId
        style.textContent = '@layer utilities{.block{display:block}}'
        style.setAttribute(attr, source)
        document.head.append(style)
    }, {
        attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
        runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
        source
    })
    await startCSSRuntimeAsync(page, undefined, loaderURL)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name),
        text: globalThis.masterCSSRuntime.text
    }))

    expect(result.progressive).toBe(false)
    expect(result.utilityRules).toEqual(['block'])
    expect(result.text).toBe('@layer utilities{.block{display:block}}')
})

test('explicit hydration manifest wins over external DOM discovery', async ({ page }) => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    css.add('fg:red-60')
    const hydrationManifest = createHydrationManifest(css)
    let requests = 0
    const loaderURL = await getRuntimeLoaderURL()
    const source = new URL('/_master-css/hydration/ignored.json', loaderURL).href

    await page.route(source, route => {
        requests++
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"version":1,"rules":[]}'
        })
    })
    await page.evaluate(({ attr, runtimeStyleId, source, text }) => {
        document.body.innerHTML = '<p class="fg:red-60"></p>'
        const style = document.createElement('style')
        style.id = runtimeStyleId
        style.textContent = text
        style.setAttribute(attr, source)
        document.head.append(style)
    }, {
        attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
        runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
        source,
        text: css.text
    })
    await startCSSRuntimeAsync(page, hydrationManifest, loaderURL)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        utilityRules: globalThis.masterCSSRuntime.utilitiesLayer.rules.map(({ name }) => name),
    }))

    expect(requests).toBe(0)
    expect(result.progressive).toBe(true)
    expect(result.utilityRules).toEqual(['fg:red-60'])
})

test('progressive hydration matches bucketed theme variables', async ({ page }) => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    css.add('fg:red-60', 'bg:blue-60')
    const hydrationManifest = createHydrationManifest(css)
    const consoleWarnings: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'warning') consoleWarnings.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<p class="fg:red-60 bg:blue-60"></p>'
    })
    await init(page, css.text, undefined, hydrationManifest)

    const result = await page.evaluate(() => ({
        progressive: globalThis.masterCSSRuntime.progressive,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
        nativeThemeRuleCount: globalThis.masterCSSRuntime.themeLayer.native?.cssRules.length,
        text: globalThis.masterCSSRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(false)
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
        progressive: globalThis.masterCSSRuntime.progressive,
        counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
        nativeThemeRuleCount: globalThis.masterCSSRuntime.themeLayer.native?.cssRules.length,
        text: globalThis.masterCSSRuntime.text
    }))

    expect(consoleWarnings.some((message) => message.includes('hydration manifest'))).toBe(false)
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
            text: globalThis.masterCSSRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts)
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
            text: globalThis.masterCSSRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts)
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
            text: globalThis.masterCSSRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts),
            nativeAttached: !!globalThis.masterCSSRuntime.themeLayer.native?.parentStyleSheet
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
            text: globalThis.masterCSSRuntime.text,
            counts: Object.fromEntries(globalThis.masterCSSRuntime.themeLayer.tokenCounts)
        }
    })

    expect(result).toEqual({
        text: '@layer utilities{.fg\\:brand{color:#123456}}',
        counts: {}
    })
})
