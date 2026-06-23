import { describe, expect, it } from 'vitest'
import { cssEscape, escapeRegExp } from '../src/source'

describe('source helpers', () => {
    it('escapes CSS identifiers', () => {
        expect(cssEscape('font:48px')).toBe('font\\:48px')
        expect(cssEscape('1col')).toBe('\\31 col')
        expect(cssEscape('-1col')).toBe('-\\31 col')
        expect(cssEscape('-')).toBe('\\-')
        expect(cssEscape('a b')).toBe('a\\ b')
    })

    it('escapes regular expression source text', () => {
        expect(escapeRegExp('a.b[c]')).toBe('a\\.b\\[c\\]')
    })
})
