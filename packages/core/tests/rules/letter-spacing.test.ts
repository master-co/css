import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('letter-spacing', () => {
    expect(createCSS().create('tracking:-.25em')?.text).toBe('.tracking\\:-\\.25em{letter-spacing:-0.25em}')
})