import { test, expect, describe } from 'vitest'
import { AtComponent, AtRule, parseAt } from '../../src'
import { MasterCSS } from '@master/css'

export const idCases = [
    ['print', { id: 'media', components: [{ token: 'print', value: 'print', type: 'string' }] }],
    ['base', { id: 'layer', components: [{ token: 'base', value: 'base', type: 'string' }] }],
    ['preset', { id: 'layer', components: [{ token: 'preset', value: 'preset', type: 'string' }] }],
    ['!print', {
        id: 'media',
        components: [
            { token: '!', value: 'not', type: 'logical' },
            { token: 'print', value: 'print', type: 'string' }
        ]
    }],
    ['start', { id: 'starting-style', components: [] }]
] as [string, AtRule][]

export const logicalCases = [
    ['and', [{ token: 'and', type: 'logical', value: 'and' }]],
    ['or', [{ token: 'or', type: 'logical', value: 'or' }]],
    ['not', [{ token: 'not', type: 'logical', value: 'not' }]],
    [',', [{ token: ',', type: 'logical', value: 'or' }]],
    ['!', [{ token: '!', type: 'logical', value: 'not' }]],
    ['&', [{ token: '&', type: 'logical', value: 'and' }]],
] as [string, AtComponent[]][]

export const rangeCases = [
    ['>=sm', [{ token: '>=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }]],
    ['<=sm', [{ token: '<=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<=' }]],
    ['>sm', [{ token: '>sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>' }]],
    ['<sm', [{ token: '<sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<' }]],
    ['sm', [{ token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }]],
] as [string, AtComponent[]][]

export const complexCases = [
    ['screen&print', [
        { token: 'screen', value: 'screen', type: 'string' },
        { token: '&', type: 'logical', value: 'and' },
        { token: 'print', value: 'print', type: 'string' }
    ]],
    ['screen,print', [
        { token: 'screen', value: 'screen', type: 'string' },
        { token: ',', type: 'logical', value: 'or' },
        { token: 'print', value: 'print', type: 'string' }
    ]],
    ['!screen', [
        { token: '!', type: 'logical', value: 'not' },
        { token: 'screen', value: 'screen', type: 'string' }
    ]],
    ['sm&<=lg', {
        id: 'media',
        components: [
            { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
            { token: '&', type: 'logical', value: 'and' },
            { token: '<=lg', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '<=' }
        ]
    }],
    ['<sm,>=lg', [
        { token: '<sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<' },
        { token: ',', type: 'logical', value: 'or' },
        { token: '>=lg', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '>=' }
    ]],
    ['landscape', [
        { token: 'landscape', name: 'orientation', type: 'string', value: 'landscape' }
    ]],
    ['starting-style', []],
    ['container(sidebar)sm', [
        { token: 'sidebar', value: 'sidebar', type: 'string' },
        { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }
    ]],
    ['sidebar(sm)', {
        id: 'container',
        components: [
            { token: 'sidebar', value: 'sidebar', type: 'string' },
            { token: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }
        ]
    }],
    ['layer(modifiers)', [
        { token: 'modifiers', value: 'modifiers', type: 'string' }
    ]],
    ['supports(transform-origin:5%|5%)', [
        { type: 'group', children: [{ type: 'string', value: 'transform-origin:5% 5%' }] }
    ]],
    ['supports(selector(:has(*)))', [
        { type: 'group', children: [{ type: 'string', value: 'selector(:has(*))' }] }
    ]],
    ['(print)and(screen)', [
        { token: 'print', value: 'print', type: 'string' },
        { token: 'and', type: 'logical', value: 'and' },
        { token: 'screen', value: 'screen', type: 'string' }
    ]],
    ['and(print&screen)', [
        { token: 'and', type: 'logical', value: 'and' },
        {
            type: 'group', children: [
                { token: 'print', value: 'print', type: 'string' },
                { token: '&', type: 'logical', value: 'and' },
                { token: 'screen', value: 'screen', type: 'string' }
            ]
        }
    ]],
    ['not(screen&(any-hover:hover))', [
        { token: 'not', type: 'logical', value: 'not' },
        {
            type: 'group', children: [
                { token: 'screen', value: 'screen', type: 'string' },
                { token: '&', type: 'logical', value: 'and' },
                { token: 'any-hover:hover', name: 'any-hover', value: 'hover', type: 'string' }
            ]
        }
    ]],
    ['media(width<=1024)&(width>=1280)', [
        { token: '<=1024', name: 'width', type: 'number', value: 64, unit: 'rem', operator: '<=' },
        { token: '&', type: 'logical', value: 'and' },
        { token: '>=1280', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '>=' }
    ]],
    ['media(width<=42mm)and(width>=38mm)', [
        { token: '<=42mm', name: 'width', type: 'number', value: 42, unit: 'mm', operator: '<=' },
        { token: 'and', type: 'logical', value: 'and' },
        { token: '>=38mm', name: 'width', type: 'number', value: 38, unit: 'mm', operator: '>=' }
    ]]
] as [string, any[] | ReturnType<typeof parseAt>][]

describe.concurrent.each([
    ['id', idCases],
    ['logical', logicalCases],
    ['range', rangeCases],
    ['complex', complexCases]
])('%s', (_, cases) => {
    test.concurrent.each(cases)('%s', (input, expected) => {
        const result = parseAt(input)
        if ('components' in expected) {
            expect(result).toEqual(expected)
        } else {
            expect(result.components).toEqual(expected)
        }
    })
})

test.concurrent('supports-backdrop from config', () => {
    const css = new MasterCSS({
        at: {
            supports: {
                backdrop: 'supports (backdrop-filter:blur(0px))'
            }
        }
    })
    expect(parseAt('supports-backdrop', css).components).toEqual([{
        token: 'supports-backdrop',
        type: 'group',
        children: [{ type: 'string', value: 'backdrop-filter:blur(0px)' }]
    }])
})

test.concurrent('config: >=42mm&<=80mm', () => {
    const css = new MasterCSS({
        at: {
            custom: '>=42mm&<=80mm'
        }
    })
    expect(parseAt('custom', css)).toEqual({
        id: 'media',
        components: [
            { token: 'custom', name: 'width', type: 'number', value: 42, unit: 'mm', operator: '>=' },
            { token: 'custom', type: 'logical', value: 'and' },
            { token: 'custom', name: 'width', type: 'number', value: 80, unit: 'mm', operator: '<=' }
        ]
    })
})
