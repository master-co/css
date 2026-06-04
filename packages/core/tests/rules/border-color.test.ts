import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates border-color rules', () => {
    expect(createCSSWithTheme().create('b:white')?.text).toContain('border-color:var(--color-white)')
    expect(createCSSWithTheme().create('b:lightest')?.text).toContain('border-color:var(--color-line-lightest)')
    expect(createCSSWithTheme().create('b:blue-50')?.text).toContain('border-color:var(--color-blue-50)')
    expect(createCSSWithTheme().create('b:rgb(0,0,0,0.75)')?.text).toContain('border-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border:white')?.text).toContain('border-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-color:white')?.text).toContain('border-color:var(--color-white)')

    expect(createCSSWithTheme().create('bb:white')?.text).toContain('border-bottom-color:var(--color-white)')
    expect(createCSSWithTheme().create('bb:rgb(0,0,0,0.75)')?.text).toContain('border-bottom-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border-bottom:white')?.text).toContain('border-bottom-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-bottom-color:white')?.text).toContain('border-bottom-color:var(--color-white)')

    expect(createCSSWithTheme().create('bt:white')?.text).toContain('border-top-color:var(--color-white)')
    expect(createCSSWithTheme().create('bt:rgb(0,0,0,0.75)')?.text).toContain('border-top-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border-top:white')?.text).toContain('border-top-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-top-color:white')?.text).toContain('border-top-color:var(--color-white)')

    expect(createCSSWithTheme().create('bl:white')?.text).toContain('border-left-color:var(--color-white)')
    expect(createCSSWithTheme().create('bl:line-lighter')?.text).toContain('border-left-color:var(--color-line-lighter)')
    expect(createCSSWithTheme().create('bl:rgb(0,0,0,0.75)')?.text).toContain('border-left-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border-left:white')?.text).toContain('border-left-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-left-color:white')?.text).toContain('border-left-color:var(--color-white)')

    expect(createCSSWithTheme().create('br:white')?.text).toContain('border-right-color:var(--color-white)')
    expect(createCSSWithTheme().create('br:rgb(0,0,0,0.75)')?.text).toContain('border-right-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border-right:white')?.text).toContain('border-right-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-right-color:white')?.text).toContain('border-right-color:var(--color-white)')

    expect(createCSSWithTheme().create('bx:white')?.text).toContain('border-left-color:var(--color-white);border-right-color:var(--color-white)')
    expect(createCSSWithTheme().create('bx:rgb(0,0,0,0.75)')?.text).toContain('border-left-color:rgb(0,0,0,0.75);border-right-color:rgb(0,0,0,0.75)')
    expect(createCSSWithTheme().create('border-x:white')?.text).toContain('border-left-color:var(--color-white);border-right-color:var(--color-white)')
    expect(createCSSWithTheme().create('border-x-color:white')?.text).toContain('border-left-color:var(--color-white);border-right-color:var(--color-white)')

    expect(createCSSWithTheme().create('border:white|solid')?.text).toContain('border:var(--color-white) solid')
})

it.concurrent('checks border-color order', () => {
    expect(createCSSWithTheme().add('bt:white', 'b:white', 'bl:white', 'bx:white').utilitiesLayer.rules)
        .toMatchObject([
            { name: 'b:white' },
            { name: 'bx:white' },
            { name: 'bl:white' },
            { name: 'bt:white' },
        ])
})
