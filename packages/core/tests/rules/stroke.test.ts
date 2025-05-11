import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('stroke-width', () => {
    expect(createCSS().create('stroke:.75!')?.text).toContain('stroke-width:0.75!important')
})

test.concurrent('stroke-color', () => {
    expect(createCSS().create('stroke:current')?.text).toContain('stroke:currentColor')
    expect(createCSS().create('stroke:black')?.text).toContain('stroke:oklch(0% 0 none)')
})