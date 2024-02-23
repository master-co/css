import { test, expect } from '@playwright/test'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('progressive', async ({ page }) => {
    await page.evaluate(() => {
        const style = document.createElement('style')
        style.id = 'master'
        document.head.append(style)
    })
    await page.addScriptTag({ path: resolve(__dirname, '../dist/global.min.js') })
    await page.evaluate(() => {
        globalThis.runtimeCSS.destroy()
    })
    expect(await page.evaluate(() => {
        globalThis.runtimeCSS.destroy()
        return document.getElementById('master')
    })).toBeDefined()
})
