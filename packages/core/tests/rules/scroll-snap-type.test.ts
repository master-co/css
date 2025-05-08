import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('scroll-snap-type', () => {
    expect(createCSS().create('scroll-snap:x')?.text).toContain('scroll-snap-type:x')
    expect(createCSS().create('scroll-snap-type:x')?.text).toContain('scroll-snap-type:x')
    expect(createCSS().create('scroll-snap-type:x|mandatory')?.text).toContain('scroll-snap-type:x mandatory')
})
