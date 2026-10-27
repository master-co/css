import { test, expect, describe } from 'vitest'
import { hint } from './helper'

describe.concurrent('sorting', () => {
  test.concurrent('positive container', () => {
    const containerLabels = new Set(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'])
    expect(hint('w-')?.map(({ label }) => label)).not.toContain('-3xs')
    expect(
      hint('w-')
        ?.filter(({ label }) => containerLabels.has(label.slice(2)))
        ?.map(({ label }) => label.slice(2))
    ).toEqual([
      '3xs',
      '2xs',
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      '5xl',
      '6xl',
      '7xl',
    ])
  })
  test.concurrent('only eligible properties offer negative numeric tokens', () => {
    const labels = hint('-m-')?.map(({ label }) => label) ?? []
    expect(labels).toEqual(expect.arrayContaining(['-m-3xs', '-m-xs', '-m-sm', '-m-md']))
    expect(hint('-w-')?.map(({ label }) => label) ?? []).not.toContain('-w-md')
  })
})
