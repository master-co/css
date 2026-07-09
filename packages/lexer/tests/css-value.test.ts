import { expect, test } from 'vitest'
import {
  collectCSSVariableReferences,
  readCSSFunction,
  replaceCSSVariableReferences
} from '../src'

test.concurrent('collects real CSS variable references outside strings and comments', () => {
  expect([...collectCSSVariableReferences([
    '.quoted { content: "var(--color-blue-60)"; }',
    '/* var(--color-red-60) */',
    '.real { color: var(--color-green-60); }',
    '.fallback { color: var(--color-brand, var(--color-green-60)); }'
  ].join('\n'))]).toEqual(['color-green-60', 'color-brand'])
})

test.concurrent('reads balanced CSS functions with nested strings and comments', () => {
  expect(readCSSFunction(
    '--alpha(var(--color-brand, "a)b") / calc(100% - 20% /* ) */))',
    0,
    '--alpha'
  )).toEqual({
    body: 'var(--color-brand, "a)b") / calc(100% - 20% /* ) */)',
    end: 61,
    text: '--alpha(var(--color-brand, "a)b") / calc(100% - 20% /* ) */))'
  })
})

test.concurrent('replaces real CSS variable references outside strings and comments', () => {
  expect(replaceCSSVariableReferences([
    '.quoted { content: "var(--color-blue-60)"; }',
    '/* var(--color-red-60) */',
    '.real { color: var(--color-green-60); }'
  ].join('\n'), (name) => `token(${name})`)).toBe([
    '.quoted { content: "var(--color-blue-60)"; }',
    '/* var(--color-red-60) */',
    '.real { color: token(color-green-60); }'
  ].join('\n'))
})
