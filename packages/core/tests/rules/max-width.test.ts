import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('max-width', () => {
    expect(createCSSWithTheme().create('max-w:screen-3xs')?.text).toBe('.max-w\\:screen-3xs{max-width:calc(var(--screen-3xs) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('max-w:screen-md')?.text).toBe('.max-w\\:screen-md{max-width:calc(var(--screen-md) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('max-w:16')?.text).toBe('.max-w\\:16{max-width:1rem}')
    expect(createCSSWithTheme().create('max-w:16px')?.text).toBe('.max-w\\:16px{max-width:16px}')
})
