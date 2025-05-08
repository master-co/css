import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import equalVariants from '../../src/utils/equal-variants'

test.concurrent('at same', () => {
    expect(equalVariants(
        createCSS().generate('block:hover@sm')[0],
        createCSS().generate('block:hover@sm')[0])
    ).toBeTruthy()
})

test.concurrent('at diff', () => {
    expect(equalVariants(
        createCSS().generate('block:hover@sm')[0],
        createCSS().generate('block:hover@md')[0])
    ).toBeFalsy()
})