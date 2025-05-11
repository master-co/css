import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('filter', () => {
    expect(createCSS().create('drop-shadow(0|2|8|black)')?.text).toBe('.drop-shadow\\(0\\|2\\|8\\|black\\){filter:drop-shadow(0rem 0.125rem 0.5rem oklch(0% 0 none))}')
    expect(createCSS().create('filter:invert(0.8)')?.text).toBe('.filter\\:invert\\(0\\.8\\){filter:invert(0.8)}')
})
