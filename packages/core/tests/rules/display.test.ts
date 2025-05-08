import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('display', () => {
    expect(createCSS().create('flex')?.text).toBe('.flex{display:flex}')
    expect(createCSS().create('flex@sm')?.text).toBe('@media (width>=52.125rem){.flex\\@sm{display:flex}}')
})
