import { expect, test } from '@playwright/test'
import init from '../../init'
import config from './master.css'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('components', async ({ page }) => {
    const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
    const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')
    await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
    await init(page, generatedCSS, config)
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.native?.cssRules.length)).toEqual(2)
    expect((await page.evaluate(() => globalThis.cssRuntime.rules)).map(({ name }) => name)).toEqual(['theme', 'main'])
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn')?.text))
        .toBe('.btn{background-color:var(--color-foo)}')
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn')?.selectorText))
        .toBe('.btn')
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn')?.native?.cssText))
        .toBe('.btn { background-color: var(--color-foo); }')
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn@sm')?.text))
        .toBe('@media (width>=52.125rem){.btn\\@sm{background-color:var(--color-foo)}}')
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn@sm')?.selectorText))
        .toBe('.btn\\@sm')
    expect(await page.evaluate(() => globalThis.cssRuntime.mainLayer.rules.find((rule) => rule.name === 'btn@sm')?.native?.cssText))
        .toBe('@media (width >= 52.125rem) {\n  .btn\\@sm { background-color: var(--color-foo); }\n}')
})
