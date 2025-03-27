import { it, test, expect } from 'vitest'
import { MasterCSS } from '../src'

test.concurrent('at components', () => {
    const rule = new MasterCSS().create('block@sm&<md')
    expect(rule?.text).toContain('@media (width>=52.125rem) and (width<64rem)')
})