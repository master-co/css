import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

it.concurrent('should not hint selectors', () => expect(hint('font-size:')?.[0]).not.toMatchObject({ insertText: 'active' }))
test.concurrent('animation delay on invoked', () => expect(hint('')?.find(({ label }) => label === 'animation-delay:')).toMatchObject({ label: 'animation-delay:' }))
test.concurrent('transition delay on invoked', () => expect(hint('')?.find(({ label }) => label === 'transition-delay:')).toMatchObject({ label: 'transition-delay:' }))
it.concurrent('starts with @', () => expect(hint('@')).toEqual([]))
it.concurrent('starts with @d', () => expect(hint('@d')).toEqual([]))
it.concurrent('removed @ key values', () => expect(hint('@duration:')).toEqual([]))
it.concurrent('starts with ~', () => expect(hint('~')).toEqual([]))
it.concurrent('starts with ~d', () => expect(hint('~d')).toEqual([]))
it.concurrent('removed ~ key values', () => expect(hint('~duration:')).toEqual([]))
test.concurrent('f', () => expect(hint('f')?.map(({ label }) => label)).toContain('font-size:'))
test.concurrent('full property name', () => expect(hint('m')?.map(({ label }) => label)).toContain("margin-top:"))
test.concurrent('retained radius corner key alias', () => expect(hint('border-top-left')?.map(({ label }) => label)).toContain("border-top-left-radius:"))
test.concurrent('removed radius side key alias', () => expect(hint('rt')?.map(({ label }) => label)).not.toContain('rt:'))
test.concurrent('native value namespace property', () => expect(hint('wid')?.map(({ label }) => label)).toContain('width:'))
test.concurrent('native SVG path property', () => expect(hint('d')?.map(({ label }) => label)).toContain('d:'))

describe.concurrent('ambiguous', () => {
  test.concurrent('t', () => expect(hint('t')?.map(({ label }) => label)).toContain('text-decoration-color:'))
  test.concurrent('removed t alias', () => expect(hint('t')?.map(({ label }) => label)).not.toContain('t:'))
})

