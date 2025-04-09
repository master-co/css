import { test, expect, describe } from 'vitest'
import equalSelectors from '../../src/utils/equal-selectors'
import { parseSelector } from '../../src'

const equivalentCases = {
    ':hover': ':hover',
    ':hover:disabled': ':disabled:hover',
    ':hover:not(:disabled)': ':not(:disabled):hover',
}

const notEquivalentCases = {
    ':hover': ':disabled',
    '_ul_li': '_li_ul',
    ':has(.active)+*': '.active:has(+*)',
}

describe('equivalent', () => {
    test.concurrent.each(Object.entries(equivalentCases))('%s', (a, b) => {
        expect(equalSelectors(parseSelector(a), parseSelector(b))).toBeTruthy()
    })
})

describe('not equivalent', () => {
    test.concurrent.each(Object.entries(notEquivalentCases))('%s', (a, b) => {
        expect(equalSelectors(parseSelector(a), parseSelector(b))).toBeFalsy()
    })
})