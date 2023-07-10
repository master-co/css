/**
 * @jest-environment node
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import path from 'path'
import { complexHTML } from './complex-html'

let browser: Browser
let page: Page

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' })
    page = (await browser.pages())[0]
    await page.addScriptTag({ path: require.resolve(path.join(__dirname, '../dist/index.browser.bundle.js')) })
})

/**
 * <p class="block font:bold">
 * <p class="block font:bold italic">
 */
it('css count class add', async () => {
    await page.evaluate(() => {
        const p1 = document.createElement('p')
        p1.classList.add('block', 'font:bold')
        document.body.append(p1)
        p1.classList.add('italic')
    })

    await page.waitForNetworkIdle()

    const countBy = await page.evaluate(() => window['MasterCSS'].root.countBy)
    expect(countBy).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
})

it('css count class complicated example', async () => {
    await page.evaluate((complexHTML) => document.body.innerHTML = complexHTML, complexHTML)
    await page.waitForNetworkIdle()
    await page.evaluate(() => document.body.innerHTML = '')
    await page.waitForNetworkIdle()
    
    const countBy = await page.evaluate(() => window['MasterCSS'].root.countBy)
    expect(countBy).toEqual({})
})

afterAll(async () => {
    await page.close()
    await browser.close()
}, 60000)