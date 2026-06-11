import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('letter-spacing', () => {
    expect(createCSSWithTheme().create('tracking:-.25em')?.text).toBe('.tracking\\:-\\.25em{letter-spacing:-0.25em}')
    expect(createCSSWithTheme().create('tracking:tight')?.text).toBe('.tracking\\:tight{letter-spacing:var(--tracking-tight)}')
    expect(createCSSWithTheme().create('letter-spacing:tight')?.text).toBe('.letter-spacing\\:tight{letter-spacing:var(--tracking-tight)}')
})
