import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('letter-spacing', () => {
    expect(createCSSWithTheme().create('tracking:-.25em')?.text).toBe('.tracking\\:-\\.25em{letter-spacing:-0.25em}')
})