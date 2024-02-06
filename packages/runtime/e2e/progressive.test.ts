import { test, expect } from '@playwright/test'
import { resolve } from 'path'

test('progressive', async ({ page }) => {
    await page.evaluate(() => {
        const style = document.createElement('style')
        style.id = 'master'
        document.head.append(style)
    })
    await page.addScriptTag({ path: resolve(__dirname, '../dist/iife.bundle.js') })
    await page.evaluate(() => {
        globalThis.runtimeCSS.destroy()
    })
    expect(await page.evaluate(() => {
        globalThis.runtimeCSS.destroy()
        return document.getElementById('master')
    })).toBeDefined()
})
