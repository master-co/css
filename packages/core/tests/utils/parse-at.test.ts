import { test, expect } from 'vitest'
import { parseAt } from '../../src'

test.concurrent('types', () => {
    expect(parseAt('print')).toEqual({ type: 'media', atComponents: [{ token: 'print', value: 'print' }] })
    expect(parseAt('base')).toEqual({ type: 'layer', atComponents: [{ token: 'base', value: 'base' }] })
    expect(parseAt('preset')).toEqual({ type: 'layer', atComponents: [{ token: 'preset', value: 'preset' }] })
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
    expect(parseAt('sm').atComponents).toEqual([{ token: 'sm', name: 'min-width', value: 52.125, unit: 'rem', operator: '>=' }])
    expect(parseAt('<=sm').atComponents).toEqual([{ token: 'sm', name: 'max-width', value: 52.125, unit: 'rem', operator: '<=' }])
    expect(parseAt('>sm').atComponents).toEqual([{ token: 'sm', name: 'min-width', value: 52.125, unit: 'rem', operator: '>' }])
    expect(parseAt('<sm').atComponents).toEqual([{ token: 'sm', name: 'max-width', value: 52.125, unit: 'rem', operator: '<' }])
    expect(parseAt('=sm').atComponents).toEqual([{ token: 'sm', name: 'width', value: 52.125, unit: 'rem', operator: '=' }])
})

test.concurrent('landscape', () => {
    expect(parseAt('landscape').atComponents).toEqual([{ token: 'landscape', name: 'orientation', value: 'landscape' }])
})

test.concurrent('container', () => {
    expect(parseAt('container(sidebar)sm').atComponents).toEqual([
        { token: 'sidebar', value: 'sidebar' },
        { token: 'sm', name: 'min-width', value: 52.125, unit: 'rem', operator: '>=' },
    ])
})

test.concurrent('supports', () => {
    expect(parseAt('supports(transform-origin:5%|5%)').atComponents).toEqual([
        {
            token: 'transform-origin:5%|5%',
            name: 'transform-origin',
            value: '5% 5%'
        }
    ])
    expect(parseAt('supports-backdrop', new MasterCSS({
        at: {
            'supports-backdrop': {
                type: 'supports',
                name: 'backdrop-filter',
                value: 'blur(0px)'
            }
        }
    })).atComponents).toEqual([
        {
            token: 'supports-backdrop',
            name: 'backdrop-filter',
            value: 'blur(0px)'
        }
    ])
})

test.concurrent('group', () => {
    expect(parseAt('(print)and(screen)').atComponents).toEqual([
        { token: 'print', value: 'print' },
        { token: 'and', type: 'operator', value: 'and' },
        { token: 'screen', value: 'screen' },
    ])
})

test.concurrent('nest', () => {
    expect(parseAt('and(print&screen)').atComponents).toEqual([
        { token: 'and', type: 'operator', value: 'and' },
        {
            type: 'group', children: [
                { token: 'print', value: 'print' },
                { token: '&', type: 'operator', value: 'and' },
                { token: 'screen', value: 'screen' }
            ]
        }
    ])
    expect(parseAt('not(screen&(any-hover:hover))').atComponents).toEqual([
        { token: 'not', type: 'operator', value: 'not' },
        {
            type: 'group', children: [
                { token: 'screen', value: 'screen' },
                { token: '&', type: 'operator', value: 'and' },
                { token: 'any-hover:hover', name: 'any-hover', value: 'hover' }
            ]
        }
    ])
})