import { test, expect, describe } from 'vitest'
import { hint } from './helper'

describe.concurrent('sorting', () => {
  test.concurrent('positive container', () => {
    const containerLabels = new Set(['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'])
    expect(hint('w:')?.map(({ label }) => label)).not.toContain('-3xs')
    expect(
      hint('w:')
        ?.filter(({ label }) => containerLabels.has(label))
        ?.map(({ label }) => label)
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
  test.concurrent('negative container', () => {
    const containerLabels = new Set(['-3xs', '-2xs', '-xs', '-sm', '-md', '-lg', '-xl', '-2xl', '-3xl', '-4xl', '-5xl', '-6xl', '-7xl'])
    expect(
      hint('w:-')
        ?.filter(({ label }) => containerLabels.has(label))
        ?.map(({ label }) => label)
    ).toEqual([
      '-3xs',
      '-2xs',
      '-xs',
      '-sm',
      '-md',
      '-lg',
      '-xl',
      '-2xl',
      '-3xl',
      '-4xl',
      '-5xl',
      '-6xl',
      '-7xl',
    ])
  })
})
