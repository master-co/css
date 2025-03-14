import { test, expect } from 'vitest'
import { MasterCSS } from '../../src'

test.concurrent('uncomplete', () => {
    expect(new MasterCSS().create('block::before,::after')?.text).toBe('.block\\:\\:before\\,\\:\\:after::before,.block\\:\\:before\\,\\:\\:after::after{display:block}')
})
