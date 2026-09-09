import { expect, test } from '@playwright/test'
import init from './init'

for (const inline of [false, true]) {
  test(`BH-0003: static dependency remains through DOM removal and explicit rule deletion, inline=${inline}`, async ({ page }) => {
    await page.setContent('<style>.probe{color:var(--color-brand,green)}</style><div class="probe">probe</div>')
    await init(page, '', {
      variables: [
        { namespace: 'color', key: 'brand', value: 'var(--color-mid)', static: true, dependencies: ['color-mid'] },
        { namespace: 'color', key: 'mid', value: 'var(--color-base)', inline, dependencies: ['color-base'] },
        { namespace: 'color', key: 'base', value: 'red' }
      ]
    })
    const probe = page.locator('.probe')
    await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
    for (let round = 0; round < 3; round++) {
      await probe.evaluate(element => element.classList.add('fg:brand'))
      await expect.poll(() => page.evaluate(() => Object.hasOwn(globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules, 'fg:brand'))).toBe(true)
      await probe.evaluate(element => element.classList.remove('fg:brand'))
      await expect.poll(() => page.evaluate(() => globalThis.__MASTER_CSS_RUNTIME_TEST__.classCounts.has('fg:brand'))).toBe(false)
      await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
      // DOM removals may retain unused rules until idle cleanup. Exercise the
      // public deletion boundary explicitly after the observer has updated counts.
      await page.evaluate(() => globalThis.masterCSSRuntime.deleteClassRules(['fg:brand']))
      await expect.poll(() => page.evaluate(() => Object.hasOwn(globalThis.__MASTER_CSS_RUNTIME_TEST__.snapshot().classRules, 'fg:brand'))).toBe(false)
      await expect(probe).toHaveCSS('color', 'rgb(255, 0, 0)')
    }
  })
}
