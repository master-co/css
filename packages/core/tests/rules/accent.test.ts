import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('accent', () => {
    expect(createCSSWithTheme().create('accent:current')?.text).toContain('accent-color:var(--color-current)')
    // expect(createCSSWithTheme().create('accent:transparent')?.text).toContain('accent-color:transparent')
})
