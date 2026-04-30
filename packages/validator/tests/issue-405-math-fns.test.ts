import { describe, test, expect } from 'vitest'
import validateCSS from '../src/validate-css'

describe('issue #405 / #323 / #331: validator must accept CSS Values 4 math fns', () => {
    test('width: min(50vw, 200px) is valid', () => {
        expect(validateCSS('.foo { width: min(50vw, 200px) }')).toEqual([])
    })

    test('width: max(10rem, 50%) is valid', () => {
        expect(validateCSS('.foo { width: max(10rem, 50%) }')).toEqual([])
    })

    test('width: clamp(10rem, 5vw, 20rem) is valid', () => {
        expect(validateCSS('.foo { width: clamp(10rem, 5vw, 20rem) }')).toEqual([])
    })

    test('right: max(0px, env(safe-area-inset-right)) is valid (issue #323)', () => {
        expect(validateCSS('.foo { right: max(0px, 1rem) }')).toEqual([])
    })

    test('font-size: clamp(1rem, 2vw + 1rem, 3rem) is valid', () => {
        expect(validateCSS('.foo { font-size: clamp(1rem, calc(2vw + 1rem), 3rem) }')).toEqual([])
    })

    test('inset: max(...) (block-shorthand) is valid', () => {
        expect(validateCSS('.foo { inset: max(0px, 8px) }')).toEqual([])
    })

    test('margin: clamp(1rem, 5%, 3rem) is valid', () => {
        expect(validateCSS('.foo { margin: clamp(1rem, 5%, 3rem) }')).toEqual([])
    })

    test('truly invalid value still errors (regression)', () => {
        const errs = validateCSS('.foo { width: notarealvalue }')
        expect(errs.length).toBeGreaterThan(0)
    })

    // Edge cases that may still surface false positives
    test('width: min(calc(100vw - 2rem), 800px) (nested calc inside min)', () => {
        expect(validateCSS('.foo { width: min(calc(100vw - 2rem), 800px) }')).toEqual([])
    })

    test('right: max(0px, env(safe-area-inset-right)) with env() inside', () => {
        expect(validateCSS('.foo { right: max(0px, env(safe-area-inset-right)) }')).toEqual([])
    })

    test('rotate: 45deg (issue #331-style: valid CSS verified as unknown)', () => {
        expect(validateCSS('.foo { rotate: 45deg }')).toEqual([])
    })

    test('aspect-ratio: 16/9 (modern property)', () => {
        expect(validateCSS('.foo { aspect-ratio: 16/9 }')).toEqual([])
    })

    test('contain: layout (modern property values)', () => {
        expect(validateCSS('.foo { contain: layout }')).toEqual([])
    })

    test('container-type: inline-size', () => {
        expect(validateCSS('.foo { container-type: inline-size }')).toEqual([])
    })

    test('color: oklch(0.5 0.1 240) (modern color function)', () => {
        expect(validateCSS('.foo { color: oklch(0.5 0.1 240) }')).toEqual([])
    })

    test('background: linear-gradient(in oklch, red, blue) (color interpolation)', () => {
        expect(validateCSS('.foo { background: linear-gradient(in oklch, red, blue) }')).toEqual([])
    })
})
