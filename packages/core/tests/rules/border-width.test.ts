import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates border-width rules', () => {
    expect(createCSS().create('b:16')?.text).toContain('border-width:1rem')
    expect(createCSS().create('border:16')?.text).toContain('border-width:1rem')
    expect(createCSS().create('border-width:16')?.text).toContain('border-width:1rem')

    expect(createCSS().create('bb:16')?.text).toContain('border-bottom-width:1rem')
    expect(createCSS().create('border-bottom:16')?.text).toContain('border-bottom-width:1rem')
    expect(createCSS().create('border-bottom-width:16')?.text).toContain('border-bottom-width:1rem')

    expect(createCSS().create('bt:16')?.text).toContain('border-top-width:1rem')
    expect(createCSS().create('border-top:16')?.text).toContain('border-top-width:1rem')
    expect(createCSS().create('border-top-width:16')?.text).toContain('border-top-width:1rem')

    expect(createCSS().create('bl:16')?.text).toContain('border-left-width:1rem')
    expect(createCSS().create('border-left:16')?.text).toContain('border-left-width:1rem')
    expect(createCSS().create('border-left-width:16')?.text).toContain('border-left-width:1rem')

    expect(createCSS().create('br:16')?.text).toContain('border-right-width:1rem')
    expect(createCSS().create('border-right:16')?.text).toContain('border-right-width:1rem')
    expect(createCSS().create('border-right-width:16')?.text).toContain('border-right-width:1rem')

    expect(createCSS().create('bx:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(createCSS().create('border-x:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(createCSS().create('border-x-width:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')

    expect(createCSS().create('border:16|solid')?.text).toContain('border:1rem solid')
})

it.concurrent('checks border-width order', () => {
    expect(createCSS().add('bt:16', 'b:16', 'bl:16', 'bx:16').generalLayer.rules)
        .toMatchObject([
            { name: 'b:16' },
            { name: 'bx:16' },
            { name: 'bl:16' },
            { name: 'bt:16' }
        ])
})