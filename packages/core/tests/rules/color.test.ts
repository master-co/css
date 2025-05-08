import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('color', () => {
    expectLayers(
        {
            general: '.color\\:current\\:hover:hover{color:currentColor}'
        },
        'color:current:hover'
    )
    expect(createCSS().create('color:current')?.declarations).toStrictEqual({ color: 'currentColor' })
    expect(createCSS().create('color:current')?.text).toContain('color:currentColor')
    expect(createCSS().create('color:rgb(255,255,255)')?.text).toContain('color:rgb(255,255,255)')
    expect(createCSS().create('fg:#fff')?.text).toContain('color:#fff')
    expect(createCSS().create('fg:current')?.text).toContain('color:currentColor')
    expect(createCSS().create('fg:transparent')?.text).toContain('color:transparent')
    expect(createCSS().create('fg:inherit')?.text).toContain('color:inherit')
})

test.concurrent('light-dark function', () => {
    expect(createCSS().create('color:light-dark(#000,#fff)')?.text).toContain('color:light-dark(#000,#fff)')
})