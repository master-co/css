import { test, expect } from '@playwright/test'
import init from './init'

test('uses bundled preset manifest when no global manifest is provided', async ({ page }) => {
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('color-white'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.manifest.version)).toBe(1)
})

test('uses the single global manifest as a complete override', async ({ page }) => {
    const manifest = {
        version: 1,
        variables: [
            { name: 'primary', key: 'primary', type: 'string', value: '#000000' }
        ]
    } as const
    await page.evaluate(({ manifest }) => {
        globalThis.masterCSSManifest = manifest
    }, { manifest })
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('primary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeUndefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.manifest.version)).toBe(1)
})
