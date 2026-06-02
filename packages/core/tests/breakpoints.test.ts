import { it, test, expect } from 'vitest'
import createCSSWithTheme from './helpers/create-css-with-theme'
test.concurrent('at components', () => {
    const rule = createCSSWithTheme().create('block@sm&<md')
    expect(rule?.text).toContain('@media (width>=52.125rem) and (width<64rem)')
})