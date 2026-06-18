// https://github.com/master-co/css/issues/383

import { test, expect } from '@playwright/test'
import init from '../../e2e/init'

test('383', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div class="text-center"></div>
        `
    })
    await init(page)
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
    await page.evaluate(() => {
        document.body.innerHTML = ``
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeNull()
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div class="font:bold fg:red"></div>
        `
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
})
