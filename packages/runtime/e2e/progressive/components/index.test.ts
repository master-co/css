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
    expect((await page.evaluate(() => cssRuntime.rules)).map(({ name }) => name)).toEqual(['layer-statement', 'components'])

    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:black'))).toMatchObject({
        nodes: [
            {
                text: '.btn{background-color:rgb(0 0 0)}',
                selectorText: '.btn',
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:black')?.nodes[0]?.native?.cssText))
        .toBe('.btn { background-color: rgb(0, 0, 0); }')

    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'block::both'))).toMatchObject({
        nodes: [
            {
                text: '.btn::before,.btn::after{display:block}',
                selectorText: '.btn::before,.btn::after',
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'block::both')?.nodes[0]?.native?.cssText))
        .toBe('.btn::before, .btn::after { display: block; }')

    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:black@sm'))).toMatchObject({
        nodes: [
            {
                text: '@media (min-width:834px){.btn\\@sm{background-color:rgb(0 0 0)}}',
                selectorText: '.btn\\@sm',
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'bg:black@sm')?.nodes[0]?.native?.cssText))
        .toBe('@media (min-width: 834px) {\n  .btn\\@sm { background-color: rgb(0, 0, 0); }\n}')

    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'block::both@sm'))).toMatchObject({
        nodes: [
            {
                text: '@media (min-width:834px){.btn\\@sm::before,.btn\\@sm::after{display:block}}',
                selectorText: '.btn\\@sm::before,.btn\\@sm::after',
                native: {} // ignore
            }
        ]
    })
    expect(await page.evaluate(() => cssRuntime.componentsLayer.rules.find((rule) => rule.name === 'block::both@sm')?.nodes[0]?.native?.cssText))
        .toBe('@media (min-width: 834px) {\n  .btn\\@sm::before, .btn\\@sm::after { display: block; }\n}')
})
