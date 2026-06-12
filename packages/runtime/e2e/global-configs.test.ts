import { test, expect } from '@playwright/test'
import { createMasterCSSPlan } from '@master/css-compiler'
import init from './init'

test('uses bundled theme plan when no global plan is provided', async ({ page }) => {
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('color-white'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.plan.version)).toBe(1)
})

test('uses the single global plan as a complete override', async ({ page }) => {
    const plan = createMasterCSSPlan({
        variables: [
            { key: 'primary', value: '#000000' }
        ]
    })
    await page.evaluate(({ plan }) => {
        globalThis.masterCSSPlan = plan
    }, { plan })
    await init(page)

    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('primary'))).toBeDefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.variables.get('font-weight-bold'))).toBeUndefined()
    expect(await page.evaluate(() => globalThis.cssRuntime.plan.version)).toBe(1)
})
