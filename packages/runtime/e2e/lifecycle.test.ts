import { test, expect } from '@playwright/test'
import init from './init'

test('destroy on progressive', async ({ page }) => {
    await init(page, '@layer base, theme, preset, components, utilities;')
    await page.evaluate(() => {
        document.body.classList.add('text:center')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer.rules.length)).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || [])
        .filter(cssRule => cssRule === globalThis.cssRuntime.utilitiesLayer.native)
        .length
    )).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
    await page.evaluate(() => {
        globalThis.cssRuntime.destroy()
        globalThis.cssRuntime.resolve()
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer.rules.length)).toBe(0)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(1)
    await page.evaluate(() => {
        globalThis.cssRuntime.observe()
        document.body.classList.add('block')
        document.body.classList.add('font:bold')
    })
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
})

test('prevent attach layer twice', async ({ page }) => {
    await init(page, '@layer base, theme, preset, components, utilities;', {
        components: {
            'app-wrapper': ['mx:auto', 'px:5x', 'h:10x']
        }
    })
    await page.evaluate(() => {
        document.body.classList.add('app-wrapper')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.native?.cssRules?.length)).toBe(3)
})
