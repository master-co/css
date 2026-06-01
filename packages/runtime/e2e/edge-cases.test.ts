import { test, expect } from '@playwright/test'
import init from './init'

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

        const shadowRuntime = new globalThis.CSSRuntime(shadow).observe()

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
        shadowText: '@layer general{.block{display:block}}',
        instanceRegistered: true
    })
})

test('progressive hydration keeps usable classes when prerendered CSS has unknown rules', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.evaluate(() => {
        document.body.innerHTML = '<div class="block"></div>'
    })
    await init(page, '@layer general{.unknown{color:red}}')

    const result = await page.evaluate(() => ({
        ruleNames: globalThis.cssRuntime.generalLayer.rules.map(({ name }) => name),
        nativeRules: Array.from(globalThis.cssRuntime.generalLayer.native?.cssRules || []).map((rule) => rule.cssText),
        text: globalThis.cssRuntime.text
    }))

    expect(consoleErrors.some((message) => message.includes('Cannot recognize') && message.includes('unknown'))).toBe(true)
    expect(result.ruleNames).toEqual(['block'])
    expect(result.nativeRules.some((text) => text.includes('.unknown'))).toBe(true)
    expect(result.nativeRules.some((text) => text.includes('.block'))).toBe(true)
    expect(result.text).toContain('.block{display:block}')
})

test('removes shared alias variable dependencies when classes disappear', async ({ page }) => {
    await init(page, '', {
        variables: [
            { key: 'brand', value: '$color-white' }
        ]
    })

    const initial = await page.evaluate(async () => {
        const el = document.createElement('p')
        el.classList.add('fg:brand', 'bg:brand')
        document.body.append(el)
        await new Promise(resolve => setTimeout(resolve, 0))
        return {
            text: globalThis.cssRuntime.themeLayer.text,
            counts: Object.fromEntries(globalThis.cssRuntime.themeLayer.tokenCounts)
        }
    })
    expect(initial).toEqual({
        text: '@layer theme{:root{--brand:var(--color-white);--color-white:oklch(100% 0 none)}}',
        counts: {
            brand: 2,
            'color-white': 2
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
        text: '@layer theme{:root{--brand:var(--color-white);--color-white:oklch(100% 0 none)}}',
        counts: {
            brand: 1,
            'color-white': 1
        }
    })

    const afterAllRemoved = await page.evaluate(async () => {
        document.querySelector('p')?.classList.remove('bg:brand')
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
