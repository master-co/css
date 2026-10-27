import { expect, it } from 'vitest'
import { cssValueStatus, validateRuleDeclarations } from '../src/value-validation'

it.each([
  ['width', 'calc(1px + 1s)', 'invalid'],
  ['width', 'calc(1px * 1px)', 'invalid'],
  ['width', 'calc(1px / 1px)', 'invalid'],
  ['width', 'calc(1px * 1px / 1px)', 'valid'],
  ['width', 'calc(calc(1px * 1px) / 1px)', 'valid'],
  ['width', 'calc((1px + 2rem) / 2)', 'valid'],
  ['width', 'calc(1px + 10%)', 'valid'],
  ['border-width', 'calc(1px + 10%)', 'invalid'],
  ['width', 'min(1px, 2s)', 'invalid'],
  ['width', 'clamp(1px, 2rem, 10vw)', 'valid'],
  ['width', 'round(1px)', 'invalid'],
  ['width', 'round(up, 1px, 2px)', 'valid'],
  ['width', 'calc(1px * sin(30deg))', 'valid'],
  ['opacity', 'sin(1px)', 'invalid'],
  ['opacity', 'sin(10%)', 'invalid'],
  ['opacity', 'calc(.5 + 10%)', 'unknown'],
  ['rotate', 'atan2(1px, 2rem)', 'valid'],
  ['rotate', 'atan2(1px, 2s)', 'invalid'],
  ['width', 'calc(var(--x) + 1px)', 'unknown'],
  ['width', 'calc(var(--x) + (1px + 1s))', 'invalid'],
  ['width', 'calc(var(--x) + 1px + 1s)', 'invalid'],
  ['width', 'calc(1px + future(2))', 'unknown'],
  ['width', 'future(calc(1px))', 'unknown'],
  ['width', 'calc(1px + 2future)', 'unknown'],
  ['width', 'calc(1px +)', 'invalid'],
  ['future-property', 'calc(1px + 10%)', 'unknown'],
  ['future-property', 'calc(1px + 1s)', 'invalid'],
  ['transform', 'translateX(calc(1px + 10%))', 'valid'],
  ['--arbitrary', 'calc(1px + 1s)', 'unknown']
])('%s:%s reports %s without computing values', (property, value, expected) => {
  expect(cssValueStatus(property, value)).toBe(expected)
})

it('checks property context without applying ordinary grammars to descriptors', () => {
  expect(validateRuleDeclarations('@page{size:calc(1cm + 1cm)}').map(value => value.status)).toEqual(['valid'])
})
