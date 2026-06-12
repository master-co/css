import { expect, test } from '@playwright/test'
import init from '../../init'
import plan from './plan'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('selectors', async ({ page, browserName }) => {
    const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
    const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')
    await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
    await init(page, generatedCSS, plan)
    expect((await page.evaluate(() => cssRuntime.rules)).map(({ name }) => name)).toEqual(['utilities'])
    expect(await page.evaluate(() => cssRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'hidden@light')?.text))
        .toBe('.light .hidden\\@light{display:none}')
    expect(await page.evaluate(() => cssRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'hidden@light')?.selectorText))
        .toBe('.light .hidden\\@light')
    expect(await page.evaluate(() => cssRuntime.utilitiesLayer.rules.find((rule) => rule.name === 'hidden@light')?.native?.cssText))
        .toBe('.light .hidden\\@light { display: none; }')

})
