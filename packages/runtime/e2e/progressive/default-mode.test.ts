import { test, expect } from '@playwright/test'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = '@layer theme{.light,:root{--base:255 255 255}.dark{--base:29 28 29}}'
    await init(page, text, { modeTrigger: 'class' })
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text)).toEqual(text)
})