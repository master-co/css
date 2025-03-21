import { test, expect } from '@playwright/test'
// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css.js'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = css_beautify(`
        @layer theme{
            :host { --base: 0 0 0; }
            :host(.dark) { --base: 34 33 35; }
            :host(.light), :host { --base: 255 255 255; }
        }
    `)
    await init(page, text, {
        modes: {
            dark: 'host',
            light: 'host'
        }
    })
    expect(css_beautify(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text))).toEqual(text)
})