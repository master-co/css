import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

test.concurrent('breakpoint', () => expect(hint("(display:none)@")?.map(({ label }) => label)).toContain('@sm'))
test.concurrent('registered mode', () => expect(hint("(display:none)@")?.map(({ label }) => label)).toContain('@dark'))

describe.concurrent('sorting', () => {
  test.concurrent('@container(--name)', () => {
    const labels = hint("(display:none)@")?.map(({ label }) => label).filter(label => label.startsWith('@container(--')) ?? []
    expect(labels).toHaveLength(26)
    expect(labels).toContain('@container(--md)')
    expect(labels).toContain('@container(--max-md)')
    expect(labels).toEqual([...labels].sort())
  })
  test.concurrent('@', () => expect(hint("(display:none)@")?.map(({ label }) => label).filter(label => !label.startsWith('@apply(') && !label.startsWith('@container(--'))).toEqual([
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
    '@max-2xl',
    '@max-2xs',
    '@max-3xl',
    '@max-3xs',
    '@max-4xl',
    '@max-4xs',
    '@max-lg',
    '@max-md',
    '@max-sm',
    '@max-xl',
    '@max-xs',
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

test('preset utilities do not become native apply completions', () => {
  const labels = hint("(display:none)@")?.map(({ label }) => label).filter(label => label.startsWith('@apply(')) ?? []
  expect(labels).toEqual([])
})
