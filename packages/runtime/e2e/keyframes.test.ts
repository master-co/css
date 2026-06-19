import { test, expect, type Page } from '@playwright/test'
import init from './init'

function expectAnimation(cssText: string, name: string, declarations: string[]) {
    expect(cssText).toContain(`@keyframes ${name}{`)
    declarations.forEach((declaration) => {
        expect(cssText).toContain(declaration)
    })
}

async function expectNoAnimation(page: Page, name: string) {
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).not.toContain(`@keyframes ${name}{`)
}

test('expects the animate token output', async ({ page }) => {
    await init(page)
    await page.evaluate(() => {
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('animate:fade')
        document.body.append(p)
    })

    const cssText = await page.evaluate(() => globalThis.cssRuntime.text)
    expect(cssText).toContain('--animate-fade:fade 1s infinite')
    expect(cssText).toContain('.animate\\:fade{animation:var(--animate-fade)}')
    expectAnimation(cssText, 'fade', ['opacity:0', 'opacity:1'])

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('animate:fade')
    })
    await expectNoAnimation(page, 'fade')
})

test('expects the animation output', async ({ page }) => {
    await init(page)
    await page.evaluate(() => {
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('animation:fade|1s')
        document.body.append(p)
    })
    expect(await page.evaluate(() => globalThis.cssRuntime.text)).toContain('.animation\\:fade\\|1s{animation:fade 1s}')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.add(
            'animation:flash|1s',
            'animation:float|1s',
            'animation:heart|1s',
            'animation:jump|1s',
            'animation:ping|1s',
            'animation:pulse|1s',
            'animation:rotate|1s',
            'animation:shake|1s',
            'animation:zoom|1s',
            '{animation:zoom|1s;f:16}'
        )
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.animationsNonLayer.tokenCounts))).toMatchObject({
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
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.animationsNonLayer.tokenCounts))).toMatchObject({
        zoom: 2,
    })
    const cssText = await page.evaluate(() => globalThis.cssRuntime.text)
    expectAnimation(cssText, 'fade', ['opacity:0', 'opacity:1'])
    expectAnimation(cssText, 'flash', ['opacity:1', 'opacity:0'])
    expectAnimation(cssText, 'float', ['transform:none', 'transform:translateY(-1.25rem)'])
    expectAnimation(cssText, 'heart', ['transform:scale(1)', 'transform:scale(1.3)'])
    expectAnimation(cssText, 'jump', ['transform:translateY(-25%)', 'transform:translateY(0)'])
    expectAnimation(cssText, 'ping', ['transform:scale(2)', 'opacity:0'])
    expectAnimation(cssText, 'pulse', ['transform:none', 'transform:scale(1.05)'])
    expectAnimation(cssText, 'rotate', ['transform:rotate(-360deg)', 'transform:none'])
    expectAnimation(cssText, 'shake', [
        'transform:none',
        'transform:translateX(-6px) rotateY(-9deg)',
        'transform:translateX(5px) rotateY(7deg)',
        'transform:translateX(-3px) rotateY(-5deg)',
        'transform:translateX(2px) rotateY(3deg)'
    ])
    expectAnimation(cssText, 'zoom', ['transform:scale(0)', 'transform:none'])
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:fade|1s')
    })
    await expectNoAnimation(page, 'fade')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:flash|1s')
    })
    await expectNoAnimation(page, 'flash')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:float|1s')
    })
    await expectNoAnimation(page, 'float')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:heart|1s')
    })
    await expectNoAnimation(page, 'heart')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:jump|1s')
    })
    await expectNoAnimation(page, 'jump')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:ping|1s')
    })
    await expectNoAnimation(page, 'ping')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:pulse|1s')
    })
    await expectNoAnimation(page, 'pulse')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:rotate|1s')
    })
    await expectNoAnimation(page, 'rotate')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:shake|1s')
    })
    await expectNoAnimation(page, 'shake')
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('animation:zoom|1s')
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.animationsNonLayer.tokenCounts))).toEqual({ zoom: 1 })
    expectAnimation(await page.evaluate(() => globalThis.cssRuntime.text), 'zoom', ['transform:scale(0)', 'transform:none'])
    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.remove('{animation:zoom|1s;f:16}')
    })

    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.animationsNonLayer.tokenCounts))).toEqual({})
    await expectNoAnimation(page, 'zoom')
})
