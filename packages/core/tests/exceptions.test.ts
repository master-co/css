import { it, test, expect } from 'vitest'
import { createCSS } from '../src'

test.concurrent('exception handling', async () => {
    const css = createCSS()
    expect(css.generate('master:css').length).toBe(0)
    expect(css.generate('{/if}').length).toBe(0)
    expect(css.generate('fg:blue').length).toBe(1)
})