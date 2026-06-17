import { test, expect } from '@playwright/test'
import init from './init'

test('uses bundled preset plan when no global plan is provided', async ({ page }) => {
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('color-white'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.plan.version)).toBe(2)
})

test('uses the single global plan as a complete override', async ({ page }) => {
    const plan = {
        version: 2,
        variables: [
            { name: 'primary', key: 'primary', type: 'string', value: '#000000' }
        ]
    } as const
    await page.evaluate(({ plan }) => {
        globalThis.masterCSSPlan = plan
    }, { plan })
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('primary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeUndefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.plan.version)).toBe(2)
})
