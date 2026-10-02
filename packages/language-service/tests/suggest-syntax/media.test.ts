import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

test.concurrent('breakpoint', () => expect(hint("display:none@")?.map(({ label }) => label)).toContain('@sm'))
for (const suffix of ['@sm&', '@sm&>', '@sm&>=', '@sm&<', '@sm&<=', '@>']) {
  test.concurrent(`does not suggest retired condition shorthand ${suffix}`, () => expect(hint(`hidden${suffix}`)).toEqual([]))
}
test.concurrent('registered mode', () => expect(hint("display:none@")?.map(({ label }) => label)).toContain('@dark'))

describe.concurrent('sorting', () => {
  test.concurrent('@', () => expect(hint("display:none@")?.map(({ label }) => label).filter(label => !label.startsWith('@apply('))).toEqual([
    '@2xl',
    '@2xs',
    '@3xl',
    '@3xs',
    '@4xl',
    '@4xs',
    '@dark',
    '@landscape',
    '@layer(base)',
    '@layer(components)',
    '@layer(defaults)',
    '@layer(utilities)',
    '@lg',
    '@light',
    '@md',
    '@motion-reduce',
    '@motion-safe',
    '@portrait',
    '@sm',
    '@starting-style',
    '@xl',
    '@xs',
    '@container()',
    '@media()',
    '@supports()',
  ]))
})

test('offers each loaded mixin as an apply completion', () => {
  const labels = hint("display:none@")?.map(({ label }) => label).filter(label => label.startsWith('@apply(')) ?? []
  expect(labels).toHaveLength(126)
  expect(labels).toContain('@apply(--p())')
  for (const name of ['text-gradient', 'text-underline', 'text-decoration', 'text-stroke', 'contain-intrinsic-block-size', 'contain-intrinsic-inline-size']) {
    expect(labels).not.toContain(`@apply(--${name}())`)
  }
  expect(labels).toEqual([...labels].sort((a, b) => a.replace('()', '').localeCompare(b.replace('()', ''))))
})
