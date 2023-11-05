/**
 * @jest-environment node
 */

import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core'
import path from 'path'
import type { MasterCSS } from '../src'

let browser: Browser
let page: Page

beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new', channel: 'chrome' })
    page = await browser.newPage()
    await page.evaluate(function () {
        window['masterCSSConfig'] = { animations: { fade: {} } }
    })
    await page.addScriptTag({ path: require.resolve(path.join(__dirname, '../dist/index.browser.bundle.js')) })
    await page.waitForNetworkIdle()
}, 60000)

it('make sure not to extend animations deeply', async () => {
    const fade = await page.evaluate(() => window.masterCSS.config.animations?.fade)
    expect(fade).toEqual({})
}, 60000)

it('expects the animation output', async () => {
    const cssText = await page.evaluate(async () => {
        window.masterCSS.refresh({})
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('@fade|1s')
        document.body.append(p)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(resolve => setTimeout(resolve, 0))
        return window.masterCSS.text
    })
    expect(cssText).toContain('.\\@fade\\|1s{animation:fade 1s}')
}, 60000)

let p: ElementHandle<Element>

it('expects the keyframe output', async () => {
    p = await page.$('#mp') as any
    let cssText = await page.evaluate(async (p) => {
        p?.classList.add(
            '@flash|1s',
            '@float|1s',
            '@heart|1s',
            '@jump|1s',
            '@ping|1s',
            '@pulse|1s',
            '@rotate|1s',
            '@shake|1s',
            '@zoom|1s',
            '{@zoom|1s;f:16}'
        )
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(resolve => setTimeout(resolve, 0))
        return window.masterCSS.text
    }, p)
    expect(cssText).toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    expect(cssText).toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    expect(cssText).toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    expect(cssText).toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    expect(cssText).toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    expect(cssText).toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    expect(cssText).toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    expect(cssText).toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    expect(cssText).toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    expect(cssText).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')

    const removeClass = async (className: string) => {
        cssText = await page.evaluate(async (p, className) => {
            p.classList.remove(className)
            await new Promise(resolve => setTimeout(resolve, 0))
            return window.masterCSS.text
        }, p, className)
    }
    await removeClass('@fade|1s')
    expect(cssText).not.toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    await removeClass('@flash|1s')
    expect(cssText).not.toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    await removeClass('@float|1s')
    expect(cssText).not.toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    await removeClass('@heart|1s')
    expect(cssText).not.toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    await removeClass('@jump|1s')
    expect(cssText).not.toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    await removeClass('@ping|1s')
    expect(cssText).not.toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    await removeClass('@pulse|1s')
    expect(cssText).not.toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    await removeClass('@rotate|1s')
    expect(cssText).not.toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    await removeClass('@shake|1s')
    expect(cssText).not.toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    await removeClass('@zoom|1s')
    expect(cssText).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    await removeClass('{@zoom|1s;f:16}')
    expect(cssText).not.toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
}, 60000)

afterAll(async () => {
    await page.close()
    await browser.close()
}, 60000)