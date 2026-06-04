import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates border-width rules', () => {
    expect(createCSSWithTheme().create('b:16')?.text).toContain('border-width:1rem')
    expect(createCSSWithTheme().create('border:16')?.text).toContain('border-width:1rem')
    expect(createCSSWithTheme().create('border-width:16')?.text).toContain('border-width:1rem')

    expect(createCSSWithTheme().create('bb:16')?.text).toContain('border-bottom-width:1rem')
    expect(createCSSWithTheme().create('border-bottom:16')?.text).toContain('border-bottom-width:1rem')
    expect(createCSSWithTheme().create('border-bottom-width:16')?.text).toContain('border-bottom-width:1rem')

    expect(createCSSWithTheme().create('bt:16')?.text).toContain('border-top-width:1rem')
    expect(createCSSWithTheme().create('border-top:16')?.text).toContain('border-top-width:1rem')
    expect(createCSSWithTheme().create('border-top-width:16')?.text).toContain('border-top-width:1rem')

    expect(createCSSWithTheme().create('bl:16')?.text).toContain('border-left-width:1rem')
    expect(createCSSWithTheme().create('border-left:16')?.text).toContain('border-left-width:1rem')
    expect(createCSSWithTheme().create('border-left-width:16')?.text).toContain('border-left-width:1rem')

    expect(createCSSWithTheme().create('br:16')?.text).toContain('border-right-width:1rem')
    expect(createCSSWithTheme().create('border-right:16')?.text).toContain('border-right-width:1rem')
    expect(createCSSWithTheme().create('border-right-width:16')?.text).toContain('border-right-width:1rem')

    expect(createCSSWithTheme().create('bx:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(createCSSWithTheme().create('border-x:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(createCSSWithTheme().create('border-x-width:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')

    expect(createCSSWithTheme().create('border:16|solid')?.text).toContain('border:1rem solid')
})

it.concurrent('checks border-width order', () => {
    expect(createCSSWithTheme().add('bt:16', 'b:16', 'bl:16', 'bx:16').utilitiesLayer.rules)
        .toMatchObject([
            { name: 'b:16' },
            { name: 'bx:16' },
            { name: 'bl:16' },
            { name: 'bt:16' }
        ])
})