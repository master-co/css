import { test, expect, type Page } from '@playwright/test'
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

async function waitForRuntimeRemovalFlush(page: Page) {
    await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve())
            })
        })
    }))
}

async function waitForRuntimeRuleFlush(page: Page) {
    await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve())
        })
    }))
}

async function flushRetainedClassRules(page: Page) {
    await page.evaluate(() => globalThis.masterCSSRuntime.flushRetainedClassRules())
}

test('expects the variable output', async ({ page }) => {
    await page.evaluate(() => {
        const p = document.createElement('p')
        p.id = 'mp'
        p.classList.add('bg:first')
        document.body.append(p)
    })
    await waitForRuntimeRuleFlush(page)
    expectLayers(
        await page.evaluate(() => globalThis.masterCSSRuntime.text),
        {
            theme: ':root{--color-first:#111111}.light{color-scheme:light;--color-first:#333333}.dark{color-scheme:dark;--color-first:#222222}',
            utilities: '.bg\\:first{background-color:var(--color-first)}'
        }
    )

    await page.evaluate(() => {
        const p = document.getElementById('mp')
        p?.classList.add(
            'bg:second',
            'b:third',
            '{outline:fourth;accent-color:fifth}',
            'fg:second',
            'accent-color:sixth'
        )
    })
    await waitForRuntimeRuleFlush(page)
    let text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
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
    expect(text).toContain('.\\{outline\\:fourth\\;accent-color\\:fifth\\}{outline-color:var(--color-fourth);accent-color:var(--color-fifth)}')
    expect(text).toContain('.fg\\:second{color:var(--color-second)}')
    expect(text).toMatch(/\.light,:root\{[^}]*--color-sixth:#666666[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('bg:second')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expect(text).toMatch(/\.dark\{[^}]*--color-second:#444444[^}]*\}/)
    expect(text).toMatch(/\.light,:root\{[^}]*--color-second:#555555[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('b:third')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expect(text).not.toMatch(/:root\{[^}]*--color-third:#666666[^}]*\}/)
    expect(text).not.toMatch(/\.light\{[^}]*--color-third:#777777[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('{outline:fourth;accent-color:fifth}')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expect(text).not.toMatch(/:root\{[^}]*--color-fourth:#888888[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fourth:#999999[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fourth:#000000[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-fifth:#022222[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-fifth:#033333[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('fg:second')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-second:#444444[^}]*\}/)
    expect(text).not.toMatch(/\.light,:root\{[^}]*--color-second:#555555[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('bg:first')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expect(text).not.toMatch(/:root\{[^}]*--color-first:#111111[^}]*\}/)
    expect(text).not.toMatch(/\.dark\{[^}]*--color-first:#222222[^}]*\}/)
    expect(text).not.toMatch(/\.light, :root\{[^}]*--color-first:#333333[^}]*\}/)

    await page.evaluate(() => {
        document.getElementById('mp')?.classList.remove('accent-color:sixth')
    })
    await waitForRuntimeRemovalFlush(page)
    await flushRetainedClassRules(page)
    text = await page.evaluate(() => globalThis.masterCSSRuntime.text)
    expectLayers(text, {})
})

test('sets native color-scheme on local class-triggered mode islands', async ({ page }) => {
    const result = await page.evaluate(async () => {
        document.documentElement.className = 'light'
        document.documentElement.style.colorScheme = 'light'
        const element = document.createElement('div')
        element.className = 'fg:second dark'
        document.body.append(element)
        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve())
            })
        })
        return {
            colorScheme: getComputedStyle(element).colorScheme,
            text: globalThis.masterCSSRuntime.text
        }
    })

    expect(result.colorScheme).toBe('dark')
    expect(result.text).toMatch(/\.dark\{color-scheme:dark;--color-second:#444444\}/)
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
