import { test, expect } from '@playwright/test'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import init from './init'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const variables = [
    { namespace: 'color', key: 'first', value: '#111111' },
    { namespace: 'color', key: 'third', value: '#666666' },
    { namespace: 'color', key: 'fourth', value: '#888888' },
    { namespace: 'color', key: 'first', value: '#333333', mode: 'light' },
    { namespace: 'color', key: 'second', value: '#555555', mode: 'light' },
    { namespace: 'color', key: 'third', value: '#777777', mode: 'light' },
    { namespace: 'color', key: 'fourth', value: '#000000', mode: 'light' },
    { namespace: 'color', key: 'fifth', value: '#033333', mode: 'light' },
    { namespace: 'color', key: 'sixth', value: '#666666', mode: 'light' },
    { namespace: 'color', key: 'first', value: '#222222', mode: 'dark' },
    { namespace: 'color', key: 'second', value: '#444444', mode: 'dark' },
    { namespace: 'color', key: 'third', value: '#666666', mode: 'dark' },
    { namespace: 'color', key: 'fourth', value: '#999999', mode: 'dark' },
    { namespace: 'color', key: 'fifth', value: '#022222', mode: 'dark' }
]

const modes = ['light', 'dark']

test.beforeEach(async ({ page }) => {
    await init(page, '', { modeTrigger: 'class' })
    await page.evaluate(({ variables, modes }) => globalThis.cssRuntime.refresh({ variables, modes, modeTrigger: 'class' }), { variables, modes })
})

test('expects the variable output', async ({ page }) => {
    expectLayers(
        await page.evaluate(async () => {
            const p = document.createElement('p')
            p.id = 'mp'
            p.classList.add('bg:first')
            document.body.append(p)
            await new Promise(resolve => setTimeout(resolve, 0))
            return globalThis.cssRuntime.text
        }),
        {
            theme: ':root{--color-first:rgb(17 17 17)}.light{--color-first:rgb(51 51 51)}.dark{--color-first:rgb(34 34 34)}',
            utilities: '.bg\\:first{background-color:var(--color-first)}'
        }
    )

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
        return globalThis.cssRuntime.text
    })
    expect(text).toMatch(/\.dark\{[^}]*--color-second:rgb\(68 68 68\)[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-second:rgb\(85 85 85\)[^}]*\}/)
    expect(text).toContain('.bg\\:second{background-color:var(--color-second)}')
    expect(text).toMatch(/:root\{[^}]*--color-third:rgb\(102 102 102\)[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--color-third:rgb\(119 119 119\)[^}]*\}/)
    expect(text).toContain('.b\\:third{border-color:var(--color-third)}')
    expect(text).toMatch(/:root\{[^}]*--color-fourth:rgb\(136 136 136\)[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--color-fourth:rgb\(153 153 153\)[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--color-fourth:rgb\(0 0 0\)[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--color-fifth:rgb\(2 34 34\)[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-fifth:rgb\(3 51 51\)[^}]*\}/)
    // todo: insertRule throw error
    // expect(text).toContain('.\\{outline\\:fourth\\;accent\\:fifth\\}{outline-color:rgb(var(--fourth));accent-color:rgb(var(--fifth))}')
    expect(text).toContain('.fg\\:second{color:var(--color-second)}')
    expect(text).toMatch(/\.light,:root\{[^}]*--color-sixth:rgb\(102 102 102\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).toMatch(/\.dark\{[^}]*--color-second:rgb\(68 68 68\)[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-second:rgb\(85 85 85\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('b:third')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-third:rgb\(102 102 102\)[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--color-third:rgb\(119 119 119\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('{outline:fourth;accent:fifth}')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-fourth:rgb\(136 136 136\)[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fourth:rgb\(153 153 153\)[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fourth:rgb\(0 0 0\)[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fifth:rgb\(2 34 34\)[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fifth:rgb\(3 51 51\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('fg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/\.dark\{[^}]*--color-second:rgb\(68 68 68\)[^}]*\}/)
    expect(text).not.toMatch(/\.light,:root\{[^}]*--color-second:rgb\(85 85 85\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:first')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-first:rgb\(17 17 17\)[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-first:rgb\(29 28 29\)[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-first:rgb\(51 51 51\)[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('accent:sixth')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expectLayers(text, {})
})

const expectLayers = (
    cssText: string,
    layers: {
        theme?: string
        components?: string
        utilities?: string
        keyframe?: string
    }
) => {
    if (layers.theme) expect(cssText).toContain(`@layer theme{${layers.theme ?? ''}}`)
    if (layers.components) expect(cssText).toContain(`@layer components{${layers.components ?? ''}}`)
    if (layers.utilities) expect(cssText).toContain(`@layer utilities{${layers.utilities ?? ''}}`)
    if (layers.keyframe) expect(cssText).toContain(`${layers.keyframe ?? ''}`)
}
