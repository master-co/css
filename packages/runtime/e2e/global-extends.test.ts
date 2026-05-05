import { test, expect } from '@playwright/test'
import init from './init'

test('extends', async ({ page }) => {
    await page.evaluate(() => {
        globalThis.masterCSSConfigs = [{
            variables: [
                { key: 'primary', value: '#000000' }
            ]
        }]
        globalThis.masterCSSConfig = {
            extends: [{
                variables: [
                    { key: 'secondary', value: '#ffffff' }
                ]
            }]
        }
    })
    await init(page)
    expect(await page.evaluate(() => globalThis.masterCSSConfigs)).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('primary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('secondary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.customConfig.extends?.length)).toBe(2)
})
