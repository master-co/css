import { it, test, expect } from 'vitest'
import equalVariants from '../../src/utils/equal-variants'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('at same', () => {
    expect(equalVariants(
        createCSSWithTheme().generate('block:hover@sm')[0],
        createCSSWithTheme().generate('block:hover@sm')[0])
    ).toBeTruthy()
})

test.concurrent('at diff', () => {
    expect(equalVariants(
        createCSSWithTheme().generate('block:hover@sm')[0],
        createCSSWithTheme().generate('block:hover@md')[0])
    ).toBeFalsy()
})