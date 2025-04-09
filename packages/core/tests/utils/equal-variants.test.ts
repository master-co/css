import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import equalVariants from '../../src/utils/equal-variants'

test.concurrent('at same', () => {
    expect(equalVariants(
        new MasterCSS().generate('block:hover@sm')[0],
        new MasterCSS().generate('block:hover@sm')[0])
    ).toBeTruthy()
})

test.concurrent('at diff', () => {
    expect(equalVariants(
        new MasterCSS().generate('block:hover@sm')[0],
        new MasterCSS().generate('block:hover@md')[0])
    ).toBeFalsy()
})