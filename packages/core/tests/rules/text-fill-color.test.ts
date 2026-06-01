import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text fill colors', () => {
    expect(createCSS().create('t:black')?.text).toBe('.t\\:black{-webkit-text-fill-color:var(--color-black)}')
    expect(createCSS().create('t:text-light')?.text).toBe('.t\\:text-light{-webkit-text-fill-color:var(--color-text-light)}')
    expect(createCSS().create('text-fill-color:black')?.text).toBe('.text-fill-color\\:black{-webkit-text-fill-color:var(--color-black)}')
})
