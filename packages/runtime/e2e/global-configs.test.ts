import { test, expect } from '@playwright/test'
import init from './init'

test('merges global config entries', async ({ page }) => {
    await page.evaluate(() => {
        globalThis.masterCSSConfigs = [{
            variables: [
                { key: 'primary', value: '#000000' }
            ]
        }, {
            variables: [
                { key: 'secondary', value: '#ffffff' }
            ]
        }]
        globalThis.masterCSSConfig = {
            variables: [
                { key: 'accent', value: '#ff0000' }
            ]
        }
    })
    await init(page)
    expect(await page.evaluate(() => globalThis.masterCSSConfigs)).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('primary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('secondary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('accent'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.config.__extended)).toBe(true)
})
