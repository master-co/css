import { it, expect } from 'vitest'
import { createCSS } from '../../src'

it.concurrent('font', () => {
    expect(createCSS().create('font:italic|1.2rem|sans')?.text).toBe('.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem var(--font-family-sans)}')
})
