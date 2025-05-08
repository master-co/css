import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('font-size', () => {
    expect(createCSS().create('font:16')?.text).toContain('font-size:1rem')
    expect(createCSS().create('font:.5')?.text).toContain('font-size:0.03125rem')
    expect(createCSS().create('font:min(10,calc(25-10))')?.text).toContain('font-size:min(0.625rem,calc(1.5625rem - 0.625rem))')
    // prevents font-size from being mapped to font shorthand
    expect(createCSS().create('font:1.2rem|"Fira Sans",sans-serif')?.text).toContain('font:1.2rem "Fira Sans",sans-serif')
})