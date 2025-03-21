import { test, expect } from '@playwright/test'
import init from './init'

test('install', async ({ page }) => {
    await init(page)
    expect(await page.evaluate(() => globalThis.__MASTER_CSS_DEVTOOLS_HOOK__)).toBeDefined()
})