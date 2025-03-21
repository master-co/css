// https://github.com/master-co/css/issues/382

import { test, expect } from '@playwright/test'
import init from '../init'

test('O to O', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div id="p1" class="p1">
                <div id="p1c2" class="p1c2"></div>
                <div id="p1c3" class="p1c3"></div>
            </div>
        `
    })
    await init(page, '@layer base, theme, preset, components, general;')
    await page.evaluate(() => {
        const createElement = (name: string) => {
            const el = document.createElement('div')
            el.id = name
            el.className = name
            return el
        }
        const p1 = document.getElementById('p1') as HTMLHeadElement
        const p1c1 = createElement('p1c1')
        const p1c2 = document.getElementById('p1c2') as HTMLHeadElement
        const p1c3 = document.getElementById('p1c3') as HTMLHeadElement
        p1.remove()
        p1.appendChild(p1c1)
        p1c2.remove()
        p1.appendChild(p1c2)
        p1c2.classList.add('p1c2-1')
        p1c3.remove()
        p1c3.classList.add('p1c3-1')
        document.body.appendChild(p1)
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toStrictEqual({
        'p1': 1,
        'p1c1': 1,
        'p1c2': 1,
        'p1c2-1': 1,
    })
})

test('O to X', async ({ page }) => {
    await page.evaluate(() => {
        document.body.innerHTML = `
            <div id="p1" class="p1">
                <div id="p1c2" class="p1c2"></div>
                <div id="p1c3" class="p1c3"></div>
            </div>
        `
    })
    await init(page, '@layer base, theme, preset, components, general;')
    await page.evaluate(() => {
        const createElement = (name: string) => {
            const el = document.createElement('div')
            el.id = name
            el.className = name
            return el
        }
        const p1 = document.getElementById('p1') as HTMLHeadElement
        const p1c1 = createElement('p1c1')
        const p1c2 = document.getElementById('p1c2') as HTMLHeadElement
        const p1c3 = document.getElementById('p1c3') as HTMLHeadElement
        p1.remove()
        p1.appendChild(p1c1)
        p1c2.remove()
        p1.appendChild(p1c2)
        p1c2.classList.add('p1c2-1')
        p1c3.remove()
        p1c3.classList.add('p1c3-1')
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toStrictEqual({})
})

test('X to O', async ({ page }) => {
    await init(page, '@layer base, theme, preset, components, general;')
    await page.evaluate(() => {
        const createElement = (name: string) => {
            const el = document.createElement('div')
            el.id = name
            el.className = name
            return el
        }
        const p1 = createElement('p1')
        p1.innerHTML = `
            <div id="p1c2" class="p1c2"></div>
            <div id="p1c3" class="p1c3"></div>
        `
        const p1c1 = createElement('p1c1')
        const p1c2 = p1.querySelector('#p1c2') as HTMLHeadElement
        const p1c3 = p1.querySelector('#p1c3') as HTMLHeadElement
        document.body.appendChild(p1)
        p1.appendChild(p1c1)
        p1c2.remove()
        p1.appendChild(p1c2)
        p1c2.classList.add('p1c2-1')
        p1c3.remove()
        p1c3.classList.add('p1c3-1')
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toStrictEqual({
        'p1': 1,
        'p1c1': 1,
        'p1c2': 1,
        'p1c2-1': 1,
    })
})


test('X to X', async ({ page }) => {
    await init(page, '@layer base, theme, preset, components, general;')
    await page.evaluate(() => {
        const createElement = (name: string) => {
            const el = document.createElement('div')
            el.id = name
            el.className = name
            return el
        }
        const p1 = createElement('p1')
        p1.innerHTML = `
            <div id="p1c2" class="p1c2"></div>
            <div id="p1c3" class="p1c3"></div>
        `
        const p1c1 = createElement('p1c1')
        const p1c2 = p1.querySelector('#p1c2') as HTMLHeadElement
        const p1c3 = p1.querySelector('#p1c3') as HTMLHeadElement
        document.body.appendChild(p1)
        p1.appendChild(p1c1)
        p1c2.remove()
        p1.appendChild(p1c2)
        p1c2.classList.add('p1c2-1')
        p1c3.remove()
        p1c3.classList.add('p1c3-1')
        p1.remove()
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toStrictEqual({})
})