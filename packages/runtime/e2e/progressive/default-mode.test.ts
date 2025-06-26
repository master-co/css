import { test, expect } from '@playwright/test'
import init from '../init'

test('prerender', async ({ page }) => {
    const text = '@layer theme{:root{--color-foo:rgb(0 0 0)}.light{--color-foo:rgb(255 255 255)}.dark{--color-foo:rgb(100 100 100)}}'
    await init(page, text, {
        modeTrigger: 'class',
        variables: {
            color: {
                foo: 'rgb(0 0 0)'
            }
        },
        modes: {
            light: {
                color: {
                    foo: 'rgb(255 255 255)'
                }
            },
            dark: {
                color: {
                    foo: 'rgb(100 100 100)'
                }
            }
        }
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.themeLayer.text)).toEqual(text)
})