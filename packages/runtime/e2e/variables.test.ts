import { test, expect } from '@playwright/test'
import { resolve } from 'path'

const variables = {
    first: {
        '': '#111111',
        '@dark': '#222222',
        '@light': '#333333'
    },
    second: {
        '@dark': '#444444',
        '@light': '#555555'
    },
    third: {
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

test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ path: resolve(__dirname, '../dist/iife.bundle.js') })
    await page.evaluate((variables) => globalThis.runtimeCSS.refresh({ variables }), variables)
})

test('make sure not to extend variables deeply', async ({ page }) => {
    expect(await page.evaluate(() => globalThis.runtimeCSS.config.variables?.first)).toEqual(variables.first)
})

test('expects the variable output', async ({ page }) => {
    expect(
        await page.evaluate(async () => {
            const p = document.createElement('p')
            p.id = 'mp'
            p.classList.add('bg:first')
            document.body.append(p)
            await new Promise(resolve => setTimeout(resolve, 0))
            return globalThis.runtimeCSS.text
        })
    ).toContain(':root{--first:17 17 17}.dark{--first:34 34 34}.light{--first:51 51 51}.bg\\:first{background-color:rgb(var(--first))}')

    let text = await page.evaluate(async () => {
        const p = document.getElementById('mp')
        p?.classList.add(
            'bg:second',
            'b:third',
            '{outline:fourth;accent:fifth}',
            'fg:second',
            'accent:sixth'
        )
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    expect(text).toContain('.bg\\:second{background-color:rgb(var(--second))}')
    expect(text).toMatch(/:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)
    expect(text).toContain('.b\\:third{border-color:rgb(var(--third))}')
    expect(text).toMatch(/:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)
    // todo: insertRule throw error
    // expect(text).toContain('.\\{outline\\:fourth\\;accent\\:fifth\\}{outline-color:rgb(var(--fourth));accent-color:rgb(var(--fifth))}')
    expect(text).toContain('.fg\\:second{color:rgb(var(--second))}')
    expect(text).toMatch(/\.dark\{[^}]*--sixth:102 102 102[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('b:third')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('{outline:fourth;accent:fifth}')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('fg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).not.toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:first')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--first:17 17 17[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--first:34 34 34[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--first:51 51 51[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('accent:sixth')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.runtimeCSS.text
    })
    expect(text).toBe('')
})