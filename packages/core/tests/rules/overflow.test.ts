import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('overflow', () => {
    expect(new MasterCSS().create('overflowed')?.text).toContain('overflow:visible')
    expect(new MasterCSS().create('overflow:hidden')?.text).toContain('overflow:hidden')
    expect(new MasterCSS().create('overflow:overlay')?.text).toContain('overflow:overlay')
    expect(new MasterCSS().create('overflow-x:overlay')?.text).toContain('overflow-x:overlay')
    expect(new MasterCSS().create('overflow-y:overlay')?.text).toContain('overflow-y:overlay')
    expect(new MasterCSS().create('overflowed:hover')?.text).toBe('.overflowed\\:hover:hover{overflow:visible}')
})
