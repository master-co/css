import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('writing', () => {
    expect(createCSSWithTheme().create('writing:rl')?.text).toContain('writing-mode:rl')
})
