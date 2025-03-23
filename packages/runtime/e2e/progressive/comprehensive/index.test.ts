import { expect, test } from '@playwright/test'
import init from '../../init'
import config from './master.css'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')

test('comprehensive', async ({ page }) => {
    await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
    await init(page, generatedCSS, config)
    const rules = await page.evaluate(() => globalThis.cssRuntime.rules)
    expect(rules.map(({ name }) => name)).toEqual(['layer-statement', 'theme', 'fade', 'base', 'preset', 'components', 'general'])
    expect(await page.evaluate(() => globalThis.cssRuntime.baseLayer.native?.cssRules.length)).toEqual(1)
    expect(await page.evaluate(() => globalThis.cssRuntime.presetLayer.native?.cssRules.length)).toEqual(1)
    expect(await page.evaluate(() => globalThis.cssRuntime.generalLayer.native?.cssRules.length)).toEqual(2)
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.native?.cssRules.length)).toEqual(1)
})
