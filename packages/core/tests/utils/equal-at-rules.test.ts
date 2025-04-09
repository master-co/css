import { test, expect, describe } from 'vitest'
import equalAtRules from '../../src/utils/equal-at-rules'
import css from '../css'

const equivalentCases = {
    'font:16@sm': 'font:32@sm',
    'font:16@sm&md': 'font:32@md&sm',
    'font:16@sm&!(print,screen)': 'font:32@!(print,screen)&sm',
}

const notEquivalentCases = {
    'font:16': 'font:32@sm',
    'font:16@sm': 'font:32@sm@supports(backdrop-filter:none)'
}

describe('equivalent', () => {
    test.concurrent.each(Object.entries(equivalentCases))('%s', (a, b) => {
        expect(equalAtRules(css.generate(a)[0].atRules, css.generate(b)[0].atRules)).toBeTruthy()
    })
})

describe('not equivalent', () => {
    test.concurrent.each(Object.entries(notEquivalentCases))('%s', (a, b) => {
        expect(equalAtRules(css.generate(a)[0].atRules, css.generate(b)[0].atRules)).toBeFalsy()
    })
})