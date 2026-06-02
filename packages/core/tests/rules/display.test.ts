import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('display', () => {
    expect(createCSSWithTheme().create('flex')?.text).toBe('.flex{display:flex}')
    expect(createCSSWithTheme().create('flex@sm')?.text).toBe('@media (width>=52.125rem){.flex\\@sm{display:flex}}')
})
