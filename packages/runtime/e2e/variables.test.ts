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
    await init(page, '', { variables, modes, modeTrigger: 'class' })
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
            theme: ':root{--color-first:#111111}.light{--color-first:#333333}.dark{--color-first:#222222}',
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
    expect(text).toMatch(/\.dark\{[^}]*--color-second:#444444[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-second:#555555[^}]*\}/)
    expect(text).toContain('.bg\\:second{background-color:var(--color-second)}')
    expect(text).toMatch(/:root\{[^}]*--color-third:#666666[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--color-third:#777777[^}]*\}/)
    expect(text).toContain('.b\\:third{border-color:var(--color-third)}')
    expect(text).toMatch(/:root\{[^}]*--color-fourth:#888888[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--color-fourth:#999999[^}]*\}/)
    expect(text).toMatch(/\.light\{[^}]*--color-fourth:#000000[^}]*\}/)
    expect(text).toMatch(/\.dark\{[^}]*--color-fifth:#022222[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-fifth:#033333[^}]*\}/)
    expect(text).toContain('.\\{outline\\:fourth\\;accent\\:fifth\\}{outline-color:var(--color-fourth);accent-color:var(--color-fifth)}')
    expect(text).toContain('.fg\\:second{color:var(--color-second)}')
    expect(text).toMatch(/\.light,:root\{[^}]*--color-sixth:#666666[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).toMatch(/\.dark\{[^}]*--color-second:#444444[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-second:#555555[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('b:third')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-third:#666666[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--color-third:#777777[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('{outline:fourth;accent:fifth}')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-fourth:#888888[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fourth:#999999[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fourth:#000000[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fifth:#022222[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fifth:#033333[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('fg:second')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/\.dark\{[^}]*--color-second:#444444[^}]*\}/)
    expect(text).not.toMatch(/\.light,:root\{[^}]*--color-second:#555555[^}]*\}/)

    text = await page.evaluate(async () => {
        document.getElementById('mp')?.classList.remove('bg:first')
        await new Promise(resolve => setTimeout(resolve, 0))
        return globalThis.cssRuntime.text
    })
    expect(text).not.toMatch(/:root\{[^}]*--color-first:#111111[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-first:#222222[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-first:#333333[^}]*\}/)

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
