import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

test.concurrent('breakpoint', () => expect(hint("display:none@")?.map(({ label }) => label)).toContain('@sm'))
for (const suffix of ['@sm&', '@sm&>', '@sm&>=', '@sm&<', '@sm&<=', '@>']) {
  test.concurrent(`does not suggest retired condition shorthand ${suffix}`, () => expect(hint(`hidden${suffix}`)).toEqual([]))
}
test.concurrent('registered mode', () => expect(hint("display:none@")?.map(({ label }) => label)).toContain('@dark'))

describe.concurrent('sorting', () => {
  test.concurrent('@', () => expect(hint("display:none@")?.map(({ label }) => label)).toEqual([
    '@2xl',
    '@2xs',
    '@3xl',
    '@3xs',
    '@4xl',
    '@4xs',
    '@all',
    '@base',
    '@component',
    '@dark',
    '@default',
    '@landscape',
    '@lg',
    '@light',
    '@md',
    '@motion',
    '@portrait',
    '@print',
    '@reduce-motion',
    '@screen',
    '@sm',
    '@speech',
    '@starting-style',
    '@utility',
    '@xl',
    '@xs',
    '@container()',
    '@media()',
    '@supports()',
  ]))
})
