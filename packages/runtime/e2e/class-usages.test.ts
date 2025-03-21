import { test, expect } from '@playwright/test'
import init from './init'

const html = `
    <div class="z:1">
        <div class="z:2">
            <div class="z:3"></div>
        </div>
    </div>
`

test('inner', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toEqual({
        'z:1': 1,
        'z:2': 1,
        'z:3': 1
    })
})

test('remove z1 element', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate(() => document.querySelector('.z\\:1')?.remove())
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({})
})

test('remove z2 element', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate(() => document.querySelector('.z\\:2')?.remove())
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({
        'z:1': 1
    })
})

test('remove z3 element', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate(() => document.querySelector('.z\\:3')?.remove())
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({
        'z:1': 1,
        'z:2': 1,
    })
})

test('remove body content and append again', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate((html) => {
        document.body.innerHTML = ''
        document.body.innerHTML = html
    }, html)
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({
        'z:1': 1,
        'z:2': 1,
        'z:3': 1,
    })
})

test('add an element to z1', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate(() => {
        const newElement = document.createElement('div')
        newElement.className = 'z:100 z:101 z:1'
        document.querySelector('.z\\:1')?.appendChild(newElement)
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({
        'z:1': 2,
        'z:2': 1,
        'z:3': 1,
        'z:100': 1,
        'z:101': 1,
    })
})

test('add an element to z2', async ({ page }) => {
    await init(page)
    await page.evaluate((html) => document.body.innerHTML = html, html)
    await page.evaluate(() => {
        const newElement = document.createElement('div')
        newElement.className = 'z:100 z:101 z:2'
        document.querySelector('.z\\:2')?.appendChild(newElement)
    })
    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classUsages))).toMatchObject({
        'z:1': 1,
        'z:2': 2,
        'z:3': 1,
        'z:100': 1,
        'z:101': 1,
    })
})
