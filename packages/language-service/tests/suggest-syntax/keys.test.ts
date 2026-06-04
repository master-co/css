import { test, it, expect, describe } from 'vitest'
import { hint } from './test'

it.concurrent('should not hint selectors', () => expect(hint('text:')?.[0]).not.toMatchObject({ insertText: 'active' }))
test.concurrent('animation delay on invoked', () => expect(hint('')?.find(({ label }) => label === 'animation-delay:')).toMatchObject({ label: 'animation-delay:' }))
test.concurrent('transition delay on invoked', () => expect(hint('')?.find(({ label }) => label === 'transition-delay:')).toMatchObject({ label: 'transition-delay:' }))
it.concurrent('starts with @', () => expect(hint('@')).toEqual([]))
it.concurrent('starts with @d', () => expect(hint('@d')).toEqual([]))
it.concurrent('removed @ key values', () => expect(hint('@duration:')).toEqual([]))
it.concurrent('starts with ~', () => expect(hint('~')).toEqual([]))
it.concurrent('starts with ~d', () => expect(hint('~d')).toEqual([]))
it.concurrent('removed ~ key values', () => expect(hint('~duration:')).toEqual([]))
test.concurrent('f', () => expect(hint('f')?.map(({ label }) => label)).toContain('font-size:'))
test.concurrent('d', () => expect(hint('d')?.map(({ label }) => label)).toContain('display:'))

describe.concurrent('ambiguous', () => {
    test.concurrent('t', () => expect(hint('t')?.map(({ label }) => label)).toContain('t:'))
    test.concurrent('t', () => expect(hint('t')?.map(({ label }) => label)).toContain('text:'))
})
