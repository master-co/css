import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('writing', () => {
    expect(createCSS().create('writing:rl')?.text).toContain('writing-mode:rl')
})
