import { it, test, expect } from 'vitest'
import { createCSS } from '../src'

test.concurrent('at components', () => {
    const rule = createCSS().create('block@sm&<md')
    expect(rule?.text).toContain('@media (width>=52.125rem) and (width<64rem)')
})