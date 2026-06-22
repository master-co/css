import { test, expect } from '@playwright/experimental-ct-react'
import RuntimeComponent from './Runtime'
import {
    externalCSS,
    externalHydrationManifest,
    externalHydrationManifestSource
} from './external-hydration-fixture'
import { MASTER_CSS_HYDRATION_MANIFEST_ATTR, serializeMasterCSSHydrationManifest } from 'shared/master-css-hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from 'shared/master-css-runtime-style'

test('Runtime - class changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing)

    const $button = await page.$('#config-btn')
    await $button?.evaluateHandle(($button) => $button.classList.add('f:10'))
    expect(await page.evaluate(() => Object.fromEntries(globalThis.masterCSSRuntime.classCounts))).toEqual({
        'btn': 1,
        'f:10': 1
    })

    await runtimeComponentInstance.unmount()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime === undefined)).toBe(true)
    expect(await page.evaluate(() => globalThis.MasterCSSRuntime.instances.has(document))).toBeFalsy()
})

test('Runtime - config changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.text)).toContain('.btn{border:0.125rem solid oklch(63.7% 0.237 25.331)}')

    const $button = await page.$('#config-btn')
    await $button?.click()
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.text)).not.toContain('.btn{border:0.125rem solid oklch(63.7% 0.237 25.331)}')
})

test('Runtime - root changed', async ({ page, mount }) => {
    const runtimeComponentInstance = await mount(<RuntimeComponent></RuntimeComponent>)
    await runtimeComponentInstance.waitFor({ state: 'visible' })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing)

    const $button = await page.$('#root-btn')
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

test('Runtime - hydrates external manifest source', async ({ page, mount }) => {
    await page.route(`**${externalHydrationManifestSource}`, route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: serializeMasterCSSHydrationManifest(externalHydrationManifest)
    }))
    await page.evaluate(({ attr, runtimeStyleId, source, text }) => {
        const style = document.createElement('style')
        style.id = runtimeStyleId
        style.textContent = text
        style.setAttribute(attr, source)
        document.head.append(style)
    }, {
        attr: MASTER_CSS_HYDRATION_MANIFEST_ATTR,
        runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID,
        source: externalHydrationManifestSource,
        text: externalCSS
    })

    const runtimeComponentInstance = await mount(<RuntimeComponent externalHydration />)
    await runtimeComponentInstance.waitFor({ state: 'visible' })
    await page.waitForFunction(() => globalThis.masterCSSRuntime?.observing)

    expect(await page.evaluate(() => {
        const runtime = globalThis.masterCSSRuntime as any
        return {
            classCounts: Object.fromEntries(runtime.classCounts),
            failure: runtime.hydrationFailureReason,
            progressive: runtime.progressive,
            rules: runtime.componentsLayer.rules.map(({ name }: { name: string }) => name),
            text: runtime.text
        }
    })).toEqual({
        classCounts: {
            btn: 1
        },
        failure: undefined,
        progressive: true,
        rules: ['btn'],
        text: externalCSS
    })
})
