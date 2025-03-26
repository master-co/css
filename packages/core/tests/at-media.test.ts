import { it, test, expect } from 'vitest'
import { MasterCSS } from '../src'

test.concurrent('print', () => {
    const rule = new MasterCSS().create('block@print')
    // expect(rule?.mediaAtComponents).toEqual([{ value: 'print' }])
    expect(rule?.text).toBe('@media print{.block\\@print{display:block}}')
})