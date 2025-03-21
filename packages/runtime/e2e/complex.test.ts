import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import init from './init'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

test('complex', async ({ page }) => {
    await init(page)
    /**
     * <p class="block font:bold">
     * <p class="block font:bold italic">
     */
    await page.evaluate(() => {
        const p1 = document.createElement('p')
        p1.classList.add('block', 'font:bold')
        document.body.append(p1)
        p1.classList.add('italic')
    })

    expect(await page.evaluate(() => Object.fromEntries(globalThis.cssRuntime.classCounts))).toEqual({
        'block': 1,
        'font:bold': 1,
        'italic': 1
    })

    expect(
        await page.evaluate((complexHTML) => {
            document.body.innerHTML = complexHTML
            return globalThis.cssRuntime.classCounts.size
        }, readFileSync(resolve(__dirname, './complex.html'), 'utf-8').toString())
    ).toBeTruthy()

    // todo: Do not work on firefox
    // expect(
    //     await page.evaluate(async () => {
    //         document.body.innerHTML = ''
    //         await new Promise(resolve => setTimeout(resolve, 100))
    //         return Object.fromEntries(globalThis.cssRuntime.classCounts)
    //     })
    // ).toEqual({})
})