import { test, expect } from '@playwright/experimental-ct-svelte'
import App from '../src/routes/+page.svelte'

// todo: initialization unexpectedly triggers refresh

test('class changed', async ({ page, mount }) => {
    const app = await mount(App)

    const $button = await page.$('#config-btn')
    await $button?.evaluateHandle(($button) => $button.classList.add('f:10'))
    expect(await page.evaluate(() => globalThis.runtimeCSS.classesUsage)).toEqual({
        'bg:blue-50': 1,
        'btn': 1,
        'f:10': 1
    })

    await app.unmount()
    expect(await page.evaluate(() => globalThis.runtimeCSS.style)).toBeNull()
    expect(await page.evaluate(() => globalThis.runtimeCSSs.length)).toBe(0)
})

test('config changed', async ({ page, mount }) => {
    await mount(App)
    expect(await page.evaluate(() => globalThis.runtimeCSS.text)).toContain('.btn{border:0.125rem rgb(var(--red)) solid}')

    const $button = await page.$('#config-btn')
    await $button?.click()
    expect(await page.evaluate(() => globalThis.runtimeCSS.text)).not.toContain('.btn{border:0.125rem rgb(var(--red)) solid}')
})

test('root changed', async ({ page, mount }) => {
    await mount(App)

    const $button = await page.$('#root-btn')
    await $button?.click()
    expect(await page.evaluate(() => globalThis.runtimeCSSs[0].classesUsage)).toEqual({
        'f:1000': 1
    })
})
