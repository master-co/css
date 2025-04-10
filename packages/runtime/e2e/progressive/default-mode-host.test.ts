import { test, expect } from '@playwright/test'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = '@layer theme{:host(.light),:host{--base:255 255 255}:host(.dark){--base:29 28 29}}'
    await init(page, text, {
        modes: {
            dark: 'host',
            light: 'host'
        }
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text)).toEqual(text)
})