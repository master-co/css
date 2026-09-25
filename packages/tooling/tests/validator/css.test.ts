import { test, it, expect } from 'vitest'
import { validateCSS } from '../../src/css'

it('selector', () => {
  expect(validateCSS('.foo:fuck { font-size: 1rem }')).toEqual([])
})

it('min fn', () => {
  expect(validateCSS('.foo { width: min(50vw, 200px) }')).toEqual([])
})

it('max fn with calc for right property', () => {
  expect(validateCSS('.foo { right: max(0px, calc(50% - 45.3125rem)) }')).toEqual([])
})

it('does not reject values whose var() or env() substitution is unknown', () => {
  expect(validateCSS('.foo { color: var(--accent); padding: env(safe-area-inset-top) }')).toEqual([])
  expect(validateCSS('.foo { padding: red }')).not.toEqual([])
})
