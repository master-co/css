import { test, it, expect } from 'vitest'
import validateCSS from '../src/validate-css'

it('selector', () => {
    expect(validateCSS('.foo:fuck { font-size: 1rem }')).toEqual([])
})

it('min fn', () => {
    expect(validateCSS('.foo { width: min(50vw, 200px) }')).toEqual([])
})

it('max fn with calc for right property', () => {
    expect(validateCSS('.foo { right: max(0px, calc(50% - 45.3125rem)) }')).toEqual([])
})
