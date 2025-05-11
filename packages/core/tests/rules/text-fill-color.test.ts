import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('text fill colors', () => {
    expect(createCSS().create('t:black')?.text).toBe('.t\\:black{-webkit-text-fill-color:oklch(0% 0 none)}')
    expect(createCSS().create('text-fill-color:black')?.text).toBe('.text-fill-color\\:black{-webkit-text-fill-color:oklch(0% 0 none)}')
})