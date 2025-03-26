import { test, expect } from 'vitest'
import { parseAt } from '../../src'

test.concurrent('basic', () => {
    expect(parseAt('print').atComponents).toEqual([{ token: 'print', value: 'print' }])
})

test.concurrent('types', () => {
    expect(parseAt('print')).toEqual({ type: 'media', atComponents: [{ token: 'print', value: 'print' }] })
    expect(parseAt('base')).toEqual({ type: 'layer', atComponents: [{ token: 'base', value: 'base' }] })
})

test.concurrent('operators', () => {
    expect(parseAt('and').atComponents).toEqual([{ token: 'and', type: 'operator', value: 'and' }])
    expect(parseAt('not').atComponents).toEqual([{ token: 'not', type: 'operator', value: 'not' }])
    expect(parseAt(',').atComponents).toEqual([{ token: ',', type: 'operator', value: 'or' }])
    expect(parseAt('!').atComponents).toEqual([{ token: '!', type: 'operator', value: 'not' }])
})

test.concurrent('&', () => {
    expect(parseAt('screen&print').atComponents).toEqual([
        { token: 'screen', value: 'screen' },
        { token: '&', type: 'operator', value: 'and' },
        { token: 'print', value: 'print' },
    ])
})

test.concurrent(',', () => {
    expect(parseAt('screen,print').atComponents).toEqual([
        { token: 'screen', value: 'screen' },
        { token: ',', type: 'operator', value: 'or' },
        { token: 'print', value: 'print' },
    ])
})

test.concurrent('!', () => {
    expect(parseAt('!screen').atComponents).toEqual([
        { token: '!', type: 'operator', value: 'not' },
        { token: 'screen', value: 'screen' },
    ])
})

test.concurrent('>= <= > <', () => {
    expect(parseAt('sm').atComponents).toEqual([{ token: 'sm', name: 'min-width', value: 834 }])
    expect(parseAt('<=sm').atComponents).toEqual([{ token: 'sm', name: 'max-width', value: 834 }])
    expect(parseAt('>sm').atComponents).toEqual([{ token: 'sm', name: 'min-width', value: 834 + 0.02 }])
    expect(parseAt('<sm').atComponents).toEqual([{ token: 'sm', name: 'max-width', value: 834 - 0.02 }])
    expect(parseAt('=sm').atComponents).toEqual([{ token: 'sm', name: 'width', value: 834 }])
})

test.concurrent('nest', () => {
    expect(parseAt('not(screen&(any-hover:hover))').atComponents).toEqual([
        { token: 'not', type: 'operator', value: 'not' },
        {
            type: 'group', children: [
                { token: 'screen', value: 'screen' },
                { token: '&', type: 'operator', value: 'and' },
                {
                    type: 'group', children: [
                        { token: 'any-hover:hover', value: 'any-hover:hover' }
                    ]
                }
            ]
        }
    ])
})