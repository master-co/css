import { test, expect } from '@playwright/test'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = '@layer theme{:root{--color-foo:rgb(0 0 0)}:host(.light){--color-foo:rgb(255 255 255)}:host(.dark){--color-foo:rgb(100 100 100)}}'
    await init(page, text, {
        modeTrigger: 'host',
        variables: [
            { namespace: 'color', key: 'foo', value: 'rgb(0 0 0)' },
            { namespace: 'color', key: 'foo', value: 'rgb(255 255 255)', mode: 'light' },
            { namespace: 'color', key: 'foo', value: 'rgb(100 100 100)', mode: 'dark' }
        ],
        modes: ['light', 'dark']
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text)).toEqual(text)
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.native?.cssRules.length)).toEqual(3)
})
