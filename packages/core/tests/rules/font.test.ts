import { it, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('font', () => {
    expect(createCSSWithTheme().create('font:italic|1.2rem|sans')?.text).toBe('.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem var(--font-family-sans)}')
})
