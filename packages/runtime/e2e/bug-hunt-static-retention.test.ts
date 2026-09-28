import { expect, test } from '@playwright/test'
import init from './init'

for (const reference of ['fg-brand', 'color:var(--color-brand)']) {
  test(`BH-0003: native dependency remains through DOM removal and explicit rule deletion, reference=${reference}`, async ({ page }) => {
    await page.setContent('<style>:root{--color-brand:var(--color-mid);--color-mid:var(--color-base);--color-base:red}.probe{color:var(--color-brand,green)}</style><div class="probe">probe</div>')
    await init(page, '', {
      variables: [{ namespace: 'color', key: 'brand', values: [{ path: [':root,:host'], value: 'var(--color-mid)' }] }]
    })
    const probe = page.locator('.probe')
    await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
    for (let round = 0; round < 3; round++) {
      await probe.evaluate((element, className) => element.classList.add(className), reference)
      await expect.poll(() => page.evaluate(className => Object.hasOwn(globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules, className), reference)).toBe(true)
      await probe.evaluate((element, className) => element.classList.remove(className), reference)
      await expect.poll(() => page.evaluate(className => globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts.has(className), reference)).toBe(false)
      await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
      // DOM removals may retain unused rules until idle cleanup. Exercise the
      // public deletion boundary explicitly after the observer has updated counts.
      await page.evaluate(className => globalThis.masterCSSRuntime.deleteClassRules([className]), reference)
      await expect.poll(() => page.evaluate(className => Object.hasOwn(globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules, className), reference)).toBe(false)
      await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
    }
  })
}
