import { it, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates border-color rules', () => {
    expect(createCSS().create('b:white')?.text).toContain('border-color:rgb(255 255 255)')
    expect(createCSS().create('b:rgb(0,0,0,0.75)')?.text).toContain('border-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border:white')?.text).toContain('border-color:rgb(255 255 255)')
    expect(createCSS().create('border-color:white')?.text).toContain('border-color:rgb(255 255 255)')

    expect(createCSS().create('bb:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')
    expect(createCSS().create('bb:rgb(0,0,0,0.75)')?.text).toContain('border-bottom-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border-bottom:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')
    expect(createCSS().create('border-bottom-color:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')

    expect(createCSS().create('bt:white')?.text).toContain('border-top-color:rgb(255 255 255)')
    expect(createCSS().create('bt:rgb(0,0,0,0.75)')?.text).toContain('border-top-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border-top:white')?.text).toContain('border-top-color:rgb(255 255 255)')
    expect(createCSS().create('border-top-color:white')?.text).toContain('border-top-color:rgb(255 255 255)')

    expect(createCSS().create('bl:white')?.text).toContain('border-left-color:rgb(255 255 255)')
    expect(createCSS().create('bl:rgb(0,0,0,0.75)')?.text).toContain('border-left-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border-left:white')?.text).toContain('border-left-color:rgb(255 255 255)')
    expect(createCSS().create('border-left-color:white')?.text).toContain('border-left-color:rgb(255 255 255)')

    expect(createCSS().create('br:white')?.text).toContain('border-right-color:rgb(255 255 255)')
    expect(createCSS().create('br:rgb(0,0,0,0.75)')?.text).toContain('border-right-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border-right:white')?.text).toContain('border-right-color:rgb(255 255 255)')
    expect(createCSS().create('border-right-color:white')?.text).toContain('border-right-color:rgb(255 255 255)')

    expect(createCSS().create('bx:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')
    expect(createCSS().create('bx:rgb(0,0,0,0.75)')?.text).toContain('border-left-color:rgb(0,0,0,0.75);border-right-color:rgb(0,0,0,0.75)')
    expect(createCSS().create('border-x:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')
    expect(createCSS().create('border-x-color:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')

    expect(createCSS().create('border:white|solid')?.text).toContain('border:rgb(255 255 255) solid')
})

it.concurrent('checks border-color order', () => {
    expect(createCSS().add('bt:white', 'b:white', 'bl:white', 'bx:white').generalLayer.rules)
        .toMatchObject([
            { name: 'b:white' },
            { name: 'bx:white' },
            { name: 'bl:white' },
            { name: 'bt:white' },
        ])
})