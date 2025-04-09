import { test, expect, describe } from 'vitest'
import equalDeclarations from '../../src/utils/equal-declarations'
import css from '../css'

const equivalentCases = {
    'font:16': 'font:32',
    'block': 'display:none',
    'inline-block': 'display:inline-block',
    'inline-flex': 'display:inline-flex',
    'inline-grid': 'display:inline-grid',
    '{text:center}': 'text:center'
}

const notEquivalentCases = {
    'text:16': 'font:32',
    '{text:center;block}': 'text:center'
}

describe('equivalent', () => {
    test.concurrent.each(Object.entries(equivalentCases))('%s', (a, b) => {
        expect(equalDeclarations(css.generate(a)[0].declarations, css.generate(b)[0].declarations)).toBeTruthy()
    })
})

describe('not equivalent', () => {
    test.concurrent.each(Object.entries(notEquivalentCases))('%s', (a, b) => {
        expect(equalDeclarations(css.generate(a)[0].declarations, css.generate(b)[0].declarations)).toBeFalsy()
    })
})