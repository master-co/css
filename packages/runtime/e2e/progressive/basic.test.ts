import { test, expect } from '@playwright/test'
import init from '../init'

test('progressive', async ({ page }) => {
    await init(page)
    await page.evaluate(() => {
        globalThis.cssRuntime.destroy()
    })
    expect(await page.evaluate(() => {
        globalThis.cssRuntime.destroy()
        return document.getElementById('master')
    })).toBeDefined()
})
