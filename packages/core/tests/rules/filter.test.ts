import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('filter', () => {
    expect(createCSSWithTheme().create('drop-shadow(0|2|8|black)')?.text).toBe('.drop-shadow\\(0\\|2\\|8\\|black\\){filter:drop-shadow(0rem 0.125rem 0.5rem var(--color-black))}')
    expect(createCSSWithTheme().create('filter:invert(0.8)')?.text).toBe('.filter\\:invert\\(0\\.8\\){filter:invert(0.8)}')
})
