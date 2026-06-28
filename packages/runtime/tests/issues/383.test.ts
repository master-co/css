// https://github.com/master-co/css/issues/383

import { test, expect, type Page } from '@playwright/test'
import init from '../../e2e/init'

async function waitForRuntimeRemovalFlush(page: Page) {
    await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve())
            })
        })
    }))
}

test('383', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div class="text-center"></div>
        `
    })
    await init(page)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
    await page.evaluate(() => {
        document.body.innerHTML = ``
    })
    await waitForRuntimeRemovalFlush(page)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeNull()
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div class="font:bold fg:red"></div>
        `
    })
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer?.native?.parentStyleSheet)).toBeDefined()
})
