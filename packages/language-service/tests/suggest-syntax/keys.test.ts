import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'

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
test.concurrent('retained key alias', () => expect(hint('m')?.map(({ label }) => label)).toContain('mt:'))
test.concurrent('retained radius corner key alias', () => expect(hint('rtl')?.map(({ label }) => label)).toContain('rtl:'))
test.concurrent('removed radius side key alias', () => expect(hint('rt')?.map(({ label }) => label)).not.toContain('rt:'))
test.concurrent('native value namespace property', () => expect(hint('wid')?.map(({ label }) => label)).toContain('width:'))
test.concurrent('removed key alias', () => expect(hint('d')?.map(({ label }) => label)).not.toContain('d:'))

describe.concurrent('ambiguous', () => {
    test.concurrent('t', () => expect(hint('t')?.map(({ label }) => label)).toContain('text:'))
    test.concurrent('removed t alias', () => expect(hint('t')?.map(({ label }) => label)).not.toContain('t:'))
})
