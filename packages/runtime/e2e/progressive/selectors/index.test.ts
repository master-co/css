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
    expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'block::before,::after'))).toMatchObject({
        nodes: [
            {
                text: '.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after{display:block}',
                selectorText: '.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after',
                suffixSelectors: ['::before', '::after'],
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'block::before,::after')?.nodes[0]?.native?.cssText))
        .toBe('.block\\:\\:before\\,\\:\\:after::before, .block\\:\\:before\\,\\:\\:after::after { display: block; }')

    if (browserName === 'firefox') {
        expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb'))).toMatchObject({
            nodes: [
                {
                    text: '.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}'
                },
                {
                    text: '.hidden\\:\\:slider-thumb::-moz-range-thumb{display:none}',
                }
            ]
        })
        expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb')?.nodes[0]?.native?.cssText))
            .toBeUndefined()
        expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb')?.nodes[1]?.native?.cssText))
            .toBe('.hidden\\:\\:slider-thumb::-moz-range-thumb { display: none; }')
    } else {
        expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb'))).toMatchObject({
            nodes: [
                {
                    text: '.hidden\\:\\:slider-thumb::-webkit-slider-thumb{display:none}',
                },
                {
                    text: '.hidden\\:\\:slider-thumb::-moz-range-thumb{display:none}',
                }
            ]
        })
        expect(await page.evaluate(() => cssRuntime.generalLayer.rules.find((rule) => rule.name === 'hidden::slider-thumb')?.nodes[0]?.native?.cssText))
            .toBe('.hidden\\:\\:slider-thumb::-webkit-slider-thumb { display: none; }')
    }
})
