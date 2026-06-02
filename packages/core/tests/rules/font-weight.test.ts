import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('font-weight', () => {
    expect(createCSSWithTheme().create('font:bolder')?.text).toBe('.font\\:bolder{font-weight:bolder}')
    expect(createCSSWithTheme().create('font:thin')?.text).toBe('.font\\:thin{font-weight:var(--font-weight-thin)}')
})
