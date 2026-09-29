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

it('validates declarations in nested native conditions as properties', () => {
  expect(validateCSS('.card { @media (width >= 40rem) { display: grid; } @supports (display: grid) { gap: 1rem; } }')).toEqual([])
  expect(validateCSS('.card { @media (width >= 40rem) { display: red; } }')).not.toEqual([])
  expect(validateCSS('@font-face { src: url(font.woff2); font-family: example; }')).toEqual([])
  expect(validateCSS('@media (width >= 40rem) { display: grid; }')).not.toEqual([])
})
