import { test, it, expect, describe } from 'vitest'
import { hint } from './test'

test.concurrent('breakpoint', () => expect(hint('hidden@')?.map(({ label }) => label)).toContain('@sm'))
test.concurrent('&', () => expect(hint('hidden@sm&')?.map(({ label }) => label)).toContain('&sm'))
test.concurrent('&>', () => expect(hint('hidden@sm&>')?.map(({ label }) => label)).toContain('>sm'))
test.concurrent('&>=', () => expect(hint('hidden@sm&>=')?.map(({ label }) => label)).toContain('>=sm'))
test.concurrent('&<', () => expect(hint('hidden@sm&<')?.map(({ label }) => label)).toContain('<sm'))
test.concurrent('&<=', () => expect(hint('hidden@sm&<=')?.map(({ label }) => label)).toContain('<=sm'))

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
        '@default',
        '@h',
        '@landscape',
        '@motion',
        '@portrait',
        '@print',
        '@reduce-motion',
        '@screen',
        '@speech',
        '@start',
        '@utility',
        '@w',
        '@container()',
        '@media()',
        '@supports()',
    ]))
    test.concurrent('@>', () => expect(hint('hidden@>')?.map(({ label }) => label)).toEqual([
        '>4xs',
        '>3xs',
        '>2xs',
        '>xs',
        '>sm',
        '>md',
        '>lg',
        '>xl',
        '>2xl',
        '>3xl',
        '>4xl'
    ]))
})
