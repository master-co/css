import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text', () => {
    expect(createCSS().create('text:20')?.text).toContain('font-size:1.25rem;line-height:calc(1.25rem + 0.875em)')
    expect(createCSS().create('text:50%')?.text).toContain('font-size:50%;line-height:calc(50% + 0.875em)')

    expect(createCSS().create('text:#fff')?.text).toContain('-webkit-text-fill-color:#fff')
    expect(createCSS().create('text:current')?.text).toContain('-webkit-text-fill-color:currentColor')
    expect(createCSS().create('text:transparent')?.text).toContain('-webkit-text-fill-color:transparent')

    expect(createCSS().create('text-stroke:#fff')?.text).toContain('-webkit-text-stroke-color:#fff')
    expect(createCSS().create('text-stroke:current')?.text).toContain('-webkit-text-stroke-color:currentColor')
    expect(createCSS().create('text-stroke:transparent')?.text).toContain('-webkit-text-stroke-color:transparent')
})
