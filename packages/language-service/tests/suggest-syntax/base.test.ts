import { expect, it, test } from 'vitest'
import { hint } from './helper'

it.concurrent('types " should hint completions', () => expect(hint('')?.length).toBeGreaterThan(0))
it.concurrent('types   should hint completions', () => expect(hint('text-center ')?.length).toBeGreaterThan(0))
it.concurrent('types dynamic enum key should hint enum values', () => {
    expect(hint('user-select:')?.some(({ label }) => label === 'none')).toBe(true)
    expect(hint('line-clamp:')?.some(({ label }) => label === 'none')).toBe(true)
})

test.todo('types any trigger character in "" should not hint')
test.todo(`types any trigger character in '' should not hint`)
test.todo('emit class="" should hint completions')
