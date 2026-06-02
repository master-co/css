import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('validates counter rules', () => {
    expect(createCSSWithTheme().create('counter-reset:section|0')?.text).toContain('counter-reset:section 0')
    expect(createCSSWithTheme().create('counter-increment:section|-1')?.text).toContain('counter-increment:section -1')
    expect(createCSSWithTheme().create('counter-set:section|4')?.text).toContain('counter-set:section 4')
})
