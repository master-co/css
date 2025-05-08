import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('caret', () => {
    expect(createCSS().create('caret:current')?.text).toContain('caret-color:currentColor')
    expect(createCSS().create('caret:transparent')?.text).toContain('caret-color:transparent')
})
