import { test, expect } from 'vitest'
import { hint } from './helper'

test.each(['{text-align:', '{block;text-align:', '{block;text-center:', '{block;text-center@'])('does not complete removed class syntax: %s', (source) => {
  expect(hint(source) ?? []).toEqual([])
})

test('does not offer the removed pseudo class', () => {
  expect(hint('display:block:')?.map(({ label }) => label)).not.toContain(':of()')
})
