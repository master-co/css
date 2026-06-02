import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('text fill colors', () => {
    expect(createCSSWithTheme().create('t:black')?.text).toBe('.t\\:black{-webkit-text-fill-color:var(--color-black)}')
    expect(createCSSWithTheme().create('t:text-light')?.text).toBe('.t\\:text-light{-webkit-text-fill-color:var(--color-text-light)}')
    expect(createCSSWithTheme().create('text-fill-color:black')?.text).toBe('.text-fill-color\\:black{-webkit-text-fill-color:var(--color-black)}')
})
