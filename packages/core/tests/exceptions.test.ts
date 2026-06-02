import { it, test, expect } from 'vitest'
import createCSSWithTheme from './helpers/create-css-with-theme'
test.concurrent('exception handling', async () => {
    const css = createCSSWithTheme()
    expect(css.generate('master:css').length).toBe(0)
    expect(css.generate('{/if}').length).toBe(0)
    expect(css.generate('fg:blue').length).toBe(1)
})