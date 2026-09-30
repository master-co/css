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
    '@apply(--clamp-lines())',
    '@apply(--font-antialiased)',
    '@apply(--font-subpixel-antialiased)',
    '@apply(--grid-col-span())',
    '@apply(--grid-cols())',
    '@apply(--grid-row-span())',
    '@apply(--grid-rows())',
    '@apply(--sr-only)',
    '@apply(--text-gradient)',
    '@apply(--text())',
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
