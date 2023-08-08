/**
 * @jest-environment node
 */

import puppeteer, { Browser, Page } from 'puppeteer-core'
import path from 'path'
import { complexHTML } from './complex-html'

let browser: Browser
let page: Page

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new', channel: 'chrome' })
    page = await browser.newPage()
    await page.addScriptTag({ path: require.resolve(path.join(__dirname, '../dist/index.browser.bundle.js')) })
    await page.waitForNetworkIdle()
}, 30000)

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

    const countBy = await page.evaluate(() => window.MasterCSS.root.countBy)
    expect(countBy).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })
}, 30000)

it('css count class complicated example', async () => {
    await page.evaluate((complexHTML) => document.body.innerHTML = complexHTML, complexHTML)
    let countBy = await page.evaluate(() => window.MasterCSS.root.countBy)
    expect(Object.keys(countBy).length).toBeTruthy()
    await page.evaluate(() => document.body.innerHTML = '')
    countBy = await page.evaluate(() => window.MasterCSS.root.countBy)
    expect(countBy).toEqual({})
}, 30000)

afterAll(async () => {
    await page.close()
    await browser.close()
}, 60000)