import { test, expect } from '@playwright/test'
import init from './init'

test('destroy on progressive', async ({ page }) => {
    await init(page, '@layer base, theme, preset, components, general;')
    await page.evaluate(() => {
        document.body.classList.add('text:center')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.generalLayer.rules.length)).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || [])
        .filter(cssRule => cssRule === globalThis.cssRuntime.generalLayer.native)
        .length
    )).toBe(1)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
    await page.evaluate(() => {
        globalThis.cssRuntime.destroy()
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.generalLayer.rules.length)).toBe(0)
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(1)
    await page.evaluate(() => {
        globalThis.cssRuntime.observe()
        document.body.classList.add('block')
        document.body.classList.add('font:bold')
    })
    expect(await page.evaluate(() => Array.from(globalThis.cssRuntime.style?.sheet?.cssRules || []).length)).toBe(2)
})