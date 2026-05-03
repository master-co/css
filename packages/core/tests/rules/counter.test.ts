import { it, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('validates counter rules', () => {
    expect(createCSS().create('counter-reset:section|0')?.text).toContain('counter-reset:section 0')
    expect(createCSS().create('counter-increment:section|-1')?.text).toContain('counter-increment:section -1')
    expect(createCSS().create('counter-set:section|4')?.text).toContain('counter-set:section 4')
})
