import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates border-style rules', () => {
    expect(createCSSWithTheme().create('b:solid')?.text).toContain('border-style:solid')
    expect(createCSSWithTheme().create('border:solid')?.text).toContain('border-style:solid')
    expect(createCSSWithTheme().create('border-style:solid')?.text).toContain('border-style:solid')

    expect(createCSSWithTheme().create('bb:solid')?.text).toContain('border-bottom-style:solid')
    expect(createCSSWithTheme().create('border-bottom:solid')?.text).toContain('border-bottom-style:solid')
    expect(createCSSWithTheme().create('border-bottom-style:solid')?.text).toContain('border-bottom-style:solid')

    expect(createCSSWithTheme().create('bt:solid')?.text).toContain('border-top-style:solid')
    expect(createCSSWithTheme().create('border-top:solid')?.text).toContain('border-top-style:solid')
    expect(createCSSWithTheme().create('border-top-style:solid')?.text).toContain('border-top-style:solid')

    expect(createCSSWithTheme().create('bl:solid')?.text).toContain('border-left-style:solid')
    expect(createCSSWithTheme().create('border-left:solid')?.text).toContain('border-left-style:solid')
    expect(createCSSWithTheme().create('border-left-style:solid')?.text).toContain('border-left-style:solid')

    expect(createCSSWithTheme().create('br:solid')?.text).toContain('border-right-style:solid')
    expect(createCSSWithTheme().create('border-right:solid')?.text).toContain('border-right-style:solid')
    expect(createCSSWithTheme().create('border-right-style:solid')?.text).toContain('border-right-style:solid')

    expect(createCSSWithTheme().create('bx:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(createCSSWithTheme().create('border-x:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(createCSSWithTheme().create('border-x-style:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')

    expect(createCSSWithTheme().create('border:solid|1')?.text).toContain('border:solid 0.0625rem')
})

it.concurrent('checks border-style order', () => {
    expect(createCSSWithTheme().add('bt:solid', 'b:solid', 'bl:dotted', 'bx:solid').generalLayer.rules)
        .toMatchObject([
            { name: 'b:solid' },
            { name: 'bx:solid' },
            { name: 'bl:dotted' },
            { name: 'bt:solid' }
        ])
})