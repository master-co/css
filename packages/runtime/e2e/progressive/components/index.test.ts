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
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.native?.cssRules.length)).toEqual(2)
    expect((await page.evaluate(() => globalThis.cssRuntime.rules)).map(({ name }) => name)).toEqual(['layer-statement', 'components'])
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo')?.text))
        .toBe('.btn{background-color:oklch(0% 0 none)}')
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo')?.selectorText))
        .toBe('.btn')
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo')?.native?.cssText))
        .toBe('.btn { background-color: oklch(0 0 none); }')
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo@sm')?.text))
        .toBe('@media (width>=52.125rem){.btn\\@sm{background-color:oklch(0% 0 none)}}')
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo@sm')?.selectorText))
        .toBe('.btn\\@sm')
    expect(await page.evaluate(() => globalThis.cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:foo@sm')?.native?.cssText))
        .toBe('@media (width >= 52.125rem) {\n  .btn\\@sm { background-color: oklch(0 0 none); }\n}')
})
