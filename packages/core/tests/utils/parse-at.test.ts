import { test, expect, describe } from 'vitest'
import { parseAt } from '../../src'

describe('id', () => {
    test.concurrent('print', ({ task }) => {
        expect(parseAt(task.name)).toEqual({ id: 'media', components: [{ token: 'print', value: 'print', type: 'string' }] })
    })
    test.concurrent('base', ({ task }) => {
        expect(parseAt(task.name)).toEqual({ id: 'layer', components: [{ token: 'base', value: 'base', type: 'string' }] })
    })
    test.concurrent('preset', ({ task }) => {
        expect(parseAt(task.name)).toEqual({ id: 'layer', components: [{ token: 'preset', value: 'preset', type: 'string' }] })
    })
    test.concurrent('!print', ({ task }) => {
        expect(parseAt(task.name)).toEqual({
            id: 'media', components: [
                { token: '!', value: 'not', type: 'logical' },
                { token: 'print', value: 'print', type: 'string' }
            ]
        })
    })
})

describe('logical', () => {
    test.concurrent('and', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: 'and', type: 'logical', value: 'and' }])
    })
    test.concurrent('or', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: 'or', type: 'logical', value: 'or' }])
    })
    test.concurrent('not', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: 'not', type: 'logical', value: 'not' }])
    })
    test.concurrent(',', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: ',', type: 'logical', value: 'or' }])
    })
    test.concurrent('!', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '!', type: 'logical', value: 'not' }])
    })
    test.concurrent('&', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '&', type: 'logical', value: 'and' }])
    })
})

test.concurrent('screen&print', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'screen', value: 'screen', type: 'string' },
        { token: '&', type: 'logical', value: 'and' },
        { token: 'print', value: 'print', type: 'string' },
    ])
})

test.concurrent('screen,print', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'screen', value: 'screen', type: 'string' },
        { token: ',', type: 'logical', value: 'or' },
        { token: 'print', value: 'print', type: 'string' },
    ])
})

test.concurrent('!screen', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: '!', type: 'logical', value: 'not' },
        { token: 'screen', value: 'screen', type: 'string' },
    ])
})

describe('>= <= > <', () => {
    test.concurrent('>=sm', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '>=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }])
    })
    test.concurrent('<=sm', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '<=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<=' }])
    })
    test.concurrent('>sm', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '>sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>' }])
    })
    test.concurrent('<sm', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: '<sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<' }])
    })
    test.concurrent('sm', ({ task }) => {
        expect(parseAt(task.name).components).toEqual([{ token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }])
    })
})

test.concurrent('sm&<=lg', ({ task }) => {
    expect(parseAt(task.name)).toEqual({
        components: [
            { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
            { token: '&', type: 'logical', value: 'and' },
            { token: '<=lg', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '<=' },
        ],
        id: 'media'
    })
})

test.concurrent('<sm,>=lg', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: '<sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<' },
        { token: ',', type: 'logical', value: 'or' },
        { token: '>=lg', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '>=' },
    ])
})

test.concurrent('landscape', () => {
    expect(parseAt('landscape').components).toEqual([{ token: 'landscape', name: 'orientation', type: 'string', value: 'landscape' }])
})

test.concurrent('starting-style', () => {
    expect(parseAt('starting-style').components).toEqual([])
})

test.concurrent('container', () => {
    expect(parseAt('container(sidebar)sm').components).toEqual([
        { token: 'sidebar', value: 'sidebar', type: 'string' },
        { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
    ])
})

test.concurrent('sidebar(sm)', ({ task }) => {
    expect(parseAt(task.name)).toEqual({
        id: 'container',
        components: [
            { token: 'sidebar', value: 'sidebar', type: 'string' },
            { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
        ]
    })
})

test.concurrent('layer(modifiers)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'modifiers', value: 'modifiers', type: 'string' },
    ])
})

test.concurrent('supports(transform-origin:5%|5%)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        {
            type: 'group',
            children: [
                {
                    type: 'string',
                    value: 'transform-origin:5% 5%'
                }
            ]
        }
    ])
})
test.concurrent('supports(selector(:has(*)))', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        {
            type: 'group',
            children: [
                {
                    type: 'string',
                    value: 'selector(:has(*))'
                }
            ]
        }
    ])
})
test.concurrent('supports-backdrop', ({ task }) => {
    expect(parseAt(task.name, new MasterCSS({
        at: {
            supports: {
                backdrop: 'supports (backdrop-filter:blur(0px))'
            }
        }
    })).components).toEqual([{
        token: 'supports-backdrop',
        type: 'group',
        children: [{
            type: 'string',
            value: 'backdrop-filter:blur(0px)'
        }]
    }])
})

test.concurrent('(print)and(screen)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'print', value: 'print', type: 'string' },
        { token: 'and', type: 'logical', value: 'and' },
        { token: 'screen', value: 'screen', type: 'string' },
    ])
})

test.concurrent('and(print&screen)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'and', type: 'logical', value: 'and' },
        {
            type: 'group', children: [
                { token: 'print', value: 'print', type: 'string' },
                { token: '&', type: 'logical', value: 'and' },
                { token: 'screen', value: 'screen', type: 'string' }
            ]
        }
    ])
})

test.concurrent('not(screen&(any-hover:hover))', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: 'not', type: 'logical', value: 'not' },
        {
            type: 'group', children: [
                { token: 'screen', value: 'screen', type: 'string' },
                { token: '&', type: 'logical', value: 'and' },
                { token: 'any-hover:hover', name: 'any-hover', value: 'hover', type: 'string' }
            ]
        }
    ])
})

test.concurrent('media(width<=1024)&(width>=1280)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: '<=1024', name: 'width', type: 'number', value: 64, unit: 'rem', operator: '<=' },
        { token: '&', type: 'logical', value: 'and' },
        { token: '>=1280', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '>=' },
    ])
})

test.concurrent('media(width<=42mm)and(width>=38mm)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: '<=42mm', name: 'width', type: 'number', value: 42, unit: 'mm', operator: '<=' },
        { token: 'and', type: 'logical', value: 'and' },
        { token: '>=38mm', name: 'width', type: 'number', value: 38, unit: 'mm', operator: '>=' },
    ])
})

describe('config', () => {
    test.concurrent('>=42mm&<=80mm', ({ task }) => {
        expect(parseAt('custom', new MasterCSS({ at: { custom: task.name } }))).toEqual({
            components: [
                { token: 'custom', name: 'width', type: 'number', value: 42, unit: 'mm', operator: '>=' },
                { token: 'custom', type: 'logical', value: 'and' },
                { token: 'custom', name: 'width', type: 'number', value: 80, unit: 'mm', operator: '<=' }
            ],
            id: 'media'
        })
    })
})
