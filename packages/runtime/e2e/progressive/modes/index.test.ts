import { expect, test } from '@playwright/test'
import init from '../../init'
import config from './master.css'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('selectors', async ({ page, browserName }) => {
    const generatedCSS = readFileSync(resolve(__dirname, 'generated.css'), 'utf-8')
    const prerenderHTML = readFileSync(resolve(__dirname, 'prerender.html'), 'utf-8')
    await page.evaluate((html) => document.body.innerHTML = html, prerenderHTML)
    await init(page, generatedCSS, config)
    expect((await page.evaluate(() => cssRuntime.rules)).map(({ name }) => name)).toEqual(['layer-statement', 'general'])
    expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden@light'))).toMatchObject({
        nodes: [
            {
                text: '.light .hidden\\@light{display:none}',
                selectorText: '.light .hidden\\@light',
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden@light')?.nodes[0]?.native?.cssText))
        .toBe('.light .hidden\\@light { display: none; }')

})
