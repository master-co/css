import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('basic', () => {
    expect(createCSSWithTheme().create('text:wrap')?.text).toContain('.text\\:wrap{text-wrap:wrap}')
    expect(createCSSWithTheme().create('text:nowrap')?.text).toContain('.text\\:nowrap{text-wrap:nowrap}')
    expect(createCSSWithTheme().create('text:balance')?.text).toContain('.text\\:balance{text-wrap:balance}')
    expect(createCSSWithTheme().create('text:pretty')?.text).toContain('.text\\:pretty{text-wrap:pretty}')
})
