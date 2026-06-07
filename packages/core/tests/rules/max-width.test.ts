import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('max-width', () => {
    expect(createCSSWithTheme().create('max-w:container-3xs')?.text).toBe('.max-w\\:container-3xs{max-width:calc(var(--container-3xs) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('max-w:container-md')?.text).toBe('.max-w\\:container-md{max-width:calc(var(--container-md) / 16 * 1rem)}')
    expect(createCSSWithTheme().create('max-w:16')?.text).toBe('.max-w\\:16{max-width:1rem}')
    expect(createCSSWithTheme().create('max-w:16px')?.text).toBe('.max-w\\:16px{max-width:16px}')
})
