import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates border-style rules', () => {
    expect(createCSS().create('b:solid')?.text).toContain('border-style:solid')
    expect(createCSS().create('border:solid')?.text).toContain('border-style:solid')
    expect(createCSS().create('border-style:solid')?.text).toContain('border-style:solid')

    expect(createCSS().create('bb:solid')?.text).toContain('border-bottom-style:solid')
    expect(createCSS().create('border-bottom:solid')?.text).toContain('border-bottom-style:solid')
    expect(createCSS().create('border-bottom-style:solid')?.text).toContain('border-bottom-style:solid')

    expect(createCSS().create('bt:solid')?.text).toContain('border-top-style:solid')
    expect(createCSS().create('border-top:solid')?.text).toContain('border-top-style:solid')
    expect(createCSS().create('border-top-style:solid')?.text).toContain('border-top-style:solid')

    expect(createCSS().create('bl:solid')?.text).toContain('border-left-style:solid')
    expect(createCSS().create('border-left:solid')?.text).toContain('border-left-style:solid')
    expect(createCSS().create('border-left-style:solid')?.text).toContain('border-left-style:solid')

    expect(createCSS().create('br:solid')?.text).toContain('border-right-style:solid')
    expect(createCSS().create('border-right:solid')?.text).toContain('border-right-style:solid')
    expect(createCSS().create('border-right-style:solid')?.text).toContain('border-right-style:solid')

    expect(createCSS().create('bx:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(createCSS().create('border-x:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(createCSS().create('border-x-style:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')

    expect(createCSS().create('border:solid|1')?.text).toContain('border:solid 0.0625rem')
})

it.concurrent('checks border-style order', () => {
    expect(createCSS().add('bt:solid', 'b:solid', 'bl:dotted', 'bx:solid').generalLayer.rules)
        .toMatchObject([
            { name: 'b:solid' },
            { name: 'bx:solid' },
            { name: 'bl:dotted' },
            { name: 'bt:solid' }
        ])
})