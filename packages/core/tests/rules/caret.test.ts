import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('caret', () => {
    expect(createCSSWithTheme().create('caret:current')?.text).toContain('caret-color:var(--color-current)')
    expect(createCSSWithTheme().create('caret:transparent')?.text).toContain('caret-color:transparent')
})
