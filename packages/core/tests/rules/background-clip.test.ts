import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
it.concurrent('background clip', () => {
    expect(createCSSWithTheme().create('bg-clip:text')?.text).toContain('background-clip:text')
})
