import { it, test, expect } from 'vitest'
import { expectLayers } from '../test'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('color', () => {
    expectLayers(
        {
            utilities: '.color\\:current\\:hover:hover{color:var(--color-current)}'
        },
        'color:current:hover'
    )
    expect(createCSSWithTheme().create('color:current')?.declarations).toStrictEqual({ color: 'var(--color-current)' })
    expect(createCSSWithTheme().create('color:current')?.text).toContain('color:var(--color-current)')
    expect(createCSSWithTheme().create('color:rgb(255,255,255)')?.text).toContain('color:rgb(255,255,255)')
    expect(createCSSWithTheme().create('fg:#fff')?.text).toContain('color:#fff')
    expect(createCSSWithTheme().create('fg:current')?.text).toContain('color:var(--color-current)')
    expect(createCSSWithTheme().create('fg:strong')?.text).toContain('color:var(--color-text-strong)')
    expect(createCSSWithTheme().create('fg:blue-50')?.text).toContain('color:var(--color-blue-50)')
    expect(createCSSWithTheme().create('fg:transparent')?.text).toContain('color:transparent')
    expect(createCSSWithTheme().create('fg:inherit')?.text).toContain('color:inherit')
})

test.concurrent('light-dark function', () => {
    expect(createCSSWithTheme().create('color:light-dark(#000,#fff)')?.text).toContain('color:light-dark(#000,#fff)')
})
