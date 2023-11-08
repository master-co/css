/**
 * @jest-environment node
 */

import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core'
import path from 'path'
import type { MasterCSS } from '../src'

const variables = {
    first: {
        '': '#111111',
        '@dark': '#222222',
        '@light': '#333333'
    },
    second:{
        '@dark': '#444444',
        '@light': '#555555'
    },
    third:{
        '': '#666666',
        '@light': '#777777'
    },
    fourth: {
        '': '#888888',
        '@dark': '#999999',
        '@light': '#000000'
    },
    fifth: {
        '@dark': '#022222',
        '@light': '#033333'
    },
    sixth: {
        '@dark': '#666666'
    }
}

let browser: Browser
let page: Page

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new', channel: 'chrome' })
    page = await browser.newPage()

    await page.evaluate(({ variables }) => window['masterCSSConfig'] = { variables }, { variables })
    await page.addScriptTag({ path: require.resolve(path.join(__dirname, '../dist/index.browser.bundle.js')) })
    await page.waitForNetworkIdle()
}, 60000)

it('make sure not to extend variables deeply', async () => {
    const first = await page.evaluate(() => window.masterCSS.config.variables?.first)
    expect(first).toEqual(variables.first)
}, 60000)

it('expects the variable output', async () => {
    const cssText = await page.evaluate(async () => {
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('bg:first')
        document.body.append(p)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(resolve => setTimeout(resolve, 0))
        return window.masterCSS.text
    })
    expect(cssText).toContain(':root{--first:17 17 17}.dark{--first:34 34 34}.light{--first:51 51 51}.bg\\:first{background-color:rgb(var(--first))}')
}, 60000)

let p: ElementHandle<Element>

it('expects the variable output', async () => {
    p = await page.$('#mp') as any
    let cssText = await page.evaluate(async (p) => {
        p?.classList.add(
            'bg:second',
            'b:third',
            '{outline:fourth;accent:fifth}',
            'fg:second',
            'accent:sixth'
        )
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(resolve => setTimeout(resolve, 0))
        return window.masterCSS.text
    }, p)
    // expect(cssText).toContain(':root{--first:17 17 17;--third:102 102 102;--fourth:136 136 136}.dark{--first:34 34 34;--second:68 68 68;--fourth:153 153 153;--fifth:2 34 34;--sixth:102 102 102}.light{--first:51 51 51;--second:85 85 85;--third:119 119 119;--fourth:0 0 0;--fifth:3 51 51}')
    expect(cssText).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(cssText).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    expect(cssText).toContain('.bg\\:second{background-color:rgb(var(--second))}')
    expect(cssText).toMatch(/\:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(cssText).toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)
    expect(cssText).toContain('.b\\:third{border-color:rgb(var(--third))}')
    expect(cssText).toMatch(/\:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(cssText).toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(cssText).toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(cssText).toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(cssText).toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)
    expect(cssText).toContain('.\\{outline\\:fourth\\;accent\\:fifth\\}{outline-color:rgb(var(--fourth));accent-color:rgb(var(--fifth))}')
    expect(cssText).toContain('.fg\\:second{color:rgb(var(--second))}')
    expect(cssText).toMatch(/\.dark\{[^}]*--sixth:102 102 102[^}]*\}/)

    const removeClass = async (className: string) => {
        cssText = await page.evaluate(async (p, className) => {
            p.classList.remove(className)
            await new Promise(resolve => setTimeout(resolve, 0))
            return window.masterCSS.text
        }, p, className)
    }
    await removeClass('bg:second')
    expect(cssText).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(cssText).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    await removeClass('b:third')
    expect(cssText).not.toMatch(/\:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(cssText).not.toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)
    await removeClass('{outline:fourth;accent:fifth}')
    expect(cssText).not.toMatch(/\:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(cssText).not.toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(cssText).not.toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(cssText).not.toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(cssText).not.toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)
    await removeClass('fg:second')
    expect(cssText).not.toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(cssText).not.toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    await removeClass('bg:first')
    expect(cssText).not.toMatch(/\:root\{[^}]*--first:17 17 17[^}]*\}/)
    expect(cssText).not.toMatch(/\.dark\{[^}]*--first:34 34 34[^}]*\}/)
    expect(cssText).not.toMatch(/\.light\{[^}]*--first:51 51 51[^}]*\}/)
    await removeClass('accent:sixth')
    expect(cssText).toBe('')
}, 60000)

afterAll(async () => {
    await page.close()
    await browser.close()
}, 60000)