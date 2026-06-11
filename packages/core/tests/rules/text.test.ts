import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text', () => {
    expect(createCSSWithTheme().create('text:20')?.text).toContain('font-size:1.25rem;line-height:max(1.8em - max(0rem, 1.25rem - 1rem) * 1.12, 1.25rem);letter-spacing:clamp(-0.072em, calc((1.25rem - 1rem) * -0.048), 0em)')
    expect(createCSSWithTheme().create('text:50%')?.text).toContain('font-size:50%;line-height:max(1.8em - max(0rem, 50% - 1rem) * 1.12, 50%);letter-spacing:clamp(-0.072em, calc((50% - 1rem) * -0.048), 0em)')

    expect(createCSSWithTheme().create('text:#fff')?.text).toContain('-webkit-text-fill-color:#fff')
    expect(createCSSWithTheme().create('text:current')?.text).toContain('-webkit-text-fill-color:var(--color-current)')
    expect(createCSSWithTheme().create('text:transparent')?.text).toContain('-webkit-text-fill-color:transparent')

    expect(createCSSWithTheme().create('text-stroke:#fff')?.text).toContain('-webkit-text-stroke-color:#fff')
    expect(createCSSWithTheme().create('text-stroke:current')?.text).toContain('-webkit-text-stroke-color:var(--color-current)')
    expect(createCSSWithTheme().create('text-stroke:transparent')?.text).toContain('-webkit-text-stroke-color:transparent')
})

test.concurrent('text size uses font-size namespace variables', () => {
    const text = createCSSWithTheme({
        variables: [
            { namespace: 'font-size', key: 'display', value: '1.125rem' },
            { namespace: 'text-size', key: 'display', value: '6rem' }
        ]
    }).create('text:display')?.text

    expect(text).toContain('font-size:var(--font-size-display)')
    expect(text).not.toContain('--text-size-display')
})
