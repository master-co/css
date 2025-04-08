import { test, expect } from '@playwright/test'
// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css.js'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = css_beautify(`
        @layer theme {
            .light,
            :root {
                --base: 255 255 255
            }
            .dark {
                --base: 29 28 29
            }
        }
    `)
    await init(page, text)
    expect(css_beautify(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text))).toEqual(text)
})