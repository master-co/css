import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('basic', () => {
    expect(createCSS().create('text:wrap')?.text).toContain('.text\\:wrap{text-wrap:wrap}')
    expect(createCSS().create('text:nowrap')?.text).toContain('.text\\:nowrap{text-wrap:nowrap}')
    expect(createCSS().create('text:balance')?.text).toContain('.text\\:balance{text-wrap:balance}')
    expect(createCSS().create('text:pretty')?.text).toContain('.text\\:pretty{text-wrap:pretty}')
})
