import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('accent', () => {
    expect(createCSS().create('accent:current')?.text).toContain('accent-color:currentColor')
    // expect(createCSS().create('accent:transparent')?.text).toContain('accent-color:transparent')
})
