import { test, expect } from '@playwright/experimental-ct-vue'
import RuntimeComponent from './Runtime.vue'
import { } from '@master/css-runtime'

test('Runtime - class changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(RuntimeComponent)
    await runtimeComponentInstance.waitFor({ state: 'visible' })

    const $button = page.locator('#config-btn')
    await $button?.evaluateHandle(($button) => $button.classList.add('f:10'))
    expect(await page.evaluate(() => Object.fromEntries(globalThis.masterCSSRuntime.classCounts))).toEqual({
        'btn': 1,
        'f:10': 1
    })

    await runtimeComponentInstance.unmount()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.style)).toBeNull()
    expect(await page.evaluate(() => globalThis.MasterCSSRuntime.instances.has(document))).toBeFalsy()
})

test('Runtime - config changed', async ({ page, mount }) => {
    await mount(RuntimeComponent)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.text)).toContain('.btn{border:0.125rem var(--color-red) solid}')

    const $button = page.locator('#config-btn')
    await $button?.click()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.text)).not.toContain('.btn{border:0.125rem var(--color-red) solid}')
})

test('Runtime - context injected', async ({ page, mount }) => {
    await mount(RuntimeComponent)
    await expect(page.locator('#runtime-context')).toHaveText('ready')
})

test('Runtime - root changed', async ({ page, mount }) => {
    await mount(RuntimeComponent)
    const $button = page.locator('#root-btn')
    await $button?.click()
    expect(await page.evaluate(() => {
        const shadowRoot = document.getElementById('container')?.shadowRoot
        if (shadowRoot) {
            const runtime = globalThis.MasterCSSRuntime.instances.get(shadowRoot)
            if (!runtime) return
            return Object.fromEntries(runtime.classCounts)
        }
    })).toEqual({
        'f:1000': 1
    })
})
