import { expect, test } from '@playwright/test'
import init from '../../init'
import manifest from './manifest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')

test('comprehensive', async ({ page }) => {
    await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
    await init(page, generatedCSS, manifest, 'auto')
    const rules = await page.evaluate(() => globalThis.masterCSSRuntime.rules)
    expect(rules.map(({ name }) => name).sort()).toEqual(['base', 'components', 'defaults', 'fade', 'theme', 'utilities'])
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.baseLayer.native?.cssRules.length)).toEqual(1)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.defaultsLayer.native?.cssRules.length)).toEqual(1)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.utilitiesLayer.native?.cssRules.length)).toEqual(2)
    expect(await page.evaluate(() => globalThis.masterCSSRuntime.componentsLayer.native?.cssRules.length)).toEqual(2)
})
