import { test, expect } from '@playwright/experimental-ct-vue'
import RuntimeComponent from './Runtime.vue'
import { } from '@master/css-runtime'

test('runtime', async ({ page, mount }) => {
    await mount(RuntimeComponent)
    expect(await page.evaluate(() => globalThis.runtimeCSS.classesUsage)).toEqual({
        'f:10': 1
    })

    const $button = await page.$('#my-btn')
    await $button?.evaluateHandle(($button) => $button.classList.add('btn'))
    expect(await page.evaluate(() => globalThis.runtimeCSS.classesUsage)).toEqual({
        'f:10': 1,
        'btn': 1
    })
    
    await $button?.click()
    expect(await page.evaluate(() => globalThis.runtimeCSS.style)).toBeNull()
    expect(await page.evaluate(() => globalThis.runtimeCSSs.length)).toBe(0)
})