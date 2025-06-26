import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('background clip', () => {
    expect(createCSS().create('bg-clip:text')?.text).toContain('background-clip:text')
})
