import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('font-size', () => {
    expect(createCSSWithTheme().create('font:16')?.text).toContain('font-size:1rem')
    expect(createCSSWithTheme().create('font:.5')?.text).toContain('font-size:0.03125rem')
    expect(createCSSWithTheme().create('font:min(10,calc(25-10))')?.text).toContain('font-size:min(0.625rem,calc(1.5625rem - 0.625rem))')
    // prevents font-size from being mapped to font shorthand
    expect(createCSSWithTheme().create('font:1.2rem|"Fira Sans",sans-serif')?.text).toContain('font:1.2rem "Fira Sans",sans-serif')
})