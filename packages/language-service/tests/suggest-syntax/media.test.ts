import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

test.concurrent('breakpoint', () => expect(hint('hidden@')?.map(({ label }) => label)).toContain('@sm'))
for (const suffix of ['@sm&', '@sm&>', '@sm&>=', '@sm&<', '@sm&<=', '@>']) {
  test.concurrent(`does not suggest retired condition shorthand ${suffix}`, () => expect(hint(`hidden${suffix}`)).toEqual([]))
}
test.concurrent('registered mode', () => expect(hint('hidden@')?.map(({ label }) => label)).toContain('@dark'))

describe.concurrent('sorting', () => {
  test.concurrent('@', () => expect(hint('hidden@')?.map(({ label }) => label)).toEqual([
    '@4xs',
    '@3xs',
    '@2xs',
    '@xs',
    '@sm',
    '@md',
    '@lg',
    '@xl',
    '@2xl',
    '@3xl',
    '@4xl',
    '@all',
    '@base',
    '@component',
    '@dark',
    '@default',
    '@landscape',
    '@light',
    '@motion',
    '@portrait',
    '@print',
    '@reduce-motion',
    '@screen',
    '@speech',
    '@starting-style',
    '@utility',
    '@container()',
    '@media()',
    '@supports()',
  ]))
})
