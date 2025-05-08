import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import { expectLayers } from '../test'

test.concurrent('inset', () => {
    expect(createCSS().create('top:20')?.text).toBe('.top\\:20{top:1.25rem}')
    expect(createCSS().create('bottom:10')?.text).toBe('.bottom\\:10{bottom:0.625rem}')
    expect(createCSS().create('inset:16')?.text).toBe('.inset\\:16{inset:1rem}')
    expect(createCSS().create('left:30')?.text).toBe('.left\\:30{left:1.875rem}')
    expect(createCSS().create('right:max(0,calc(50%-725))')?.text).toBe('.right\\:max\\(0\\,calc\\(50\\%-725\\)\\){right:max(0rem,calc(50% - 45.3125rem))}')
})

it.concurrent('checks inset order', () => {
    expect(createCSS().add('top:0', 'left:0', 'inset:0', 'right:0', 'bottom:0').generalLayer.rules)
        .toMatchObject([
            { name: 'inset:0' },
            { name: 'bottom:0' },
            { name: 'left:0' },
            { name: 'right:0' },
            { name: 'top:0' }
        ])
})

test.concurrent('directions', () => {
    expect(createCSS().create('top:0')?.text).toBe('.top\\:0{top:0rem}')
    expect(createCSS().create('left:0')?.text).toBe('.left\\:0{left:0rem}')
    expect(createCSS().create('right:0')?.text).toBe('.right\\:0{right:0rem}')
    expect(createCSS().create('bottom:0')?.text).toBe('.bottom\\:0{bottom:0rem}')
})