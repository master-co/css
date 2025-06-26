import { test, expect } from '@playwright/experimental-ct-react'
import RuntimeComponent from './Runtime'

test('Runtime - class changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })

    const $button = await page.$('#config-btn')
    await $button?.evaluateHandle(($button) => $button.classList.add('f:10'))
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classCounts))).toEqual({
        'btn': 1,
        'f:10': 1
    })

    await runtimeComponentInstance.unmount()
    expect(await page.evaluate(() => globalThis.cssRuntime.style)).toBeNull()
    expect(await page.evaluate(() => globalThis.CSSRuntime.instances.has(document))).toBeFalsy()
})

test('Runtime - config changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).toContain('.btn{border:0.125rem var(--color-red) solid}')

    const $button = await page.$('#config-btn')
    await $button?.click()
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('.btn{border:0.125rem var(--color-red) solid}')
})

test('Runtime - root changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })

    const $button = await page.$('#root-btn')
    await $button?.click()
    expect(await page.evaluate(() => {
        const shadowRoot = document.getElementById('container')?.shadowRoot
        if (shadowRoot) {
            const runtime = globalThis.CSSRuntime.instances.get(shadowRoot)
            if (!runtime) return
            return Object.fromEntries(runtime.classCounts)
        }
    })).toEqual({
        'f:1000': 1
    })
})
