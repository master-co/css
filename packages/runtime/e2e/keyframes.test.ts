import { test, expect } from '@playwright/test'
import init from './init'

test('expects the animation output', async ({ page, browserName }) => {
    await init(page)
    await page.evaluate(() => {
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('@fade|1s')
        document.body.append(p)
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).toContain('.\\@fade\\|1s{animation:fade 1s}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
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
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.animationsNonLayer.usages)).toMatchObject({
        fade: 1,
        flash: 1,
        float: 1,
        heart: 1,
        jump: 1,
        ping: 1,
        pulse: 1,
        rotate: 1,
        shake: 1,
    })
    // TODO: firefox -> 1
    if (browserName !== 'firefox') {
        expect(await page.evaluate(() => globalThis.cssRuntime.animationsNonLayer.usages)).toMatchObject({
            zoom: 2,
        })
    }
    const cssText = await page.evaluate(() => globalThis.cssRuntime.text)
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
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@fade|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@flash|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@float|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@heart|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@jump|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@ping|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@pulse|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@rotate|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@shake|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('@zoom|1s')
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.animationsNonLayer.usages)).toEqual({ zoom: 1 })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('{@zoom|1s;f:16}')
    })

    // TODO: firefox -> 1
    if (browserName !== 'firefox') {
        expect(await page.evaluate(() => globalThis.cssRuntime.animationsNonLayer.usages)).toMatchObject({})
        expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    }
})
