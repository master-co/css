import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('checks margin order', () => {
    expect(createCSS().add('mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0').generalLayer.rules)
        .toMatchObject([
            { name: 'm:0' },
            { name: 'mx:0' },
            { name: 'my:0' },
            { name: 'mb:0' },
            { name: 'ml:0' },
            { name: 'mr:0' },
            { name: 'mt:0' }
        ])
})

test.concurrent('margin', () => {
    expect(createCSS().create('ml:16')?.text).toContain('margin-left:1rem')
    expect(createCSS().create('ml:4x')?.text).toContain('margin-left:1rem')
    expect(createCSS().create('mr:16')?.text).toContain('margin-right:1rem')
    expect(createCSS().create('mt:16')?.text).toContain('margin-top:1rem')
    expect(createCSS().create('mb:16')?.text).toContain('margin-bottom:1rem')
    expect(createCSS().create('m:16')?.text).toContain('margin:1rem')
    expect(createCSS().create('mx:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(createCSS().create('my:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
    expect(createCSS().create('margin-x:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(createCSS().create('margin-y:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
})

test.concurrent('margin inline', () => {
    expect(createCSS().create('mis:16')?.text).toContain('margin-inline-start:1rem')
    expect(createCSS().create('mie:16')?.text).toContain('margin-inline-end:1rem')
    expect(createCSS().create('mi:16')?.text).toContain('margin-inline:1rem')
})