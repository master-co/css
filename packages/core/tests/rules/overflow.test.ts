import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('overflow', () => {
    expect(createCSS().create('overflow')?.text).toContain('overflow:visible')
    expect(createCSS().create('overflow:hidden')?.text).toContain('overflow:hidden')
    expect(createCSS().create('overflow:overlay')?.text).toContain('overflow:overlay')
    expect(createCSS().create('overflow-x:overlay')?.text).toContain('overflow-x:overlay')
    expect(createCSS().create('overflow-y:overlay')?.text).toContain('overflow-y:overlay')
})
