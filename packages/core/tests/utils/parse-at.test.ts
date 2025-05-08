import { test, expect, describe } from 'vitest'
import { AtRule, Config, parseAt } from '../../src'
import { createCSS } from '@master/css'

export const cases = {
    id: [
        ['print', '@media print', { id: 'media', nodes: [{ raw: 'print', value: 'print', type: 'string' }] }],
        ['base', '@layer base', { id: 'layer', nodes: [{ raw: 'base', value: 'base', type: 'string' }] }],
        ['preset', '@layer preset', { id: 'layer', nodes: [{ raw: 'preset', value: 'preset', type: 'string' }] }],
        ['!print', '@media not print', {
            id: 'media',
            nodes: [
                { raw: '!', value: 'not', type: 'logical' },
                { raw: 'print', value: 'print', type: 'string' }
            ]
        }],
        ['start', '@starting-style', { id: 'starting-style', nodes: [] }],
    ],
    logical: [
        ['and()', '@media and', { id: 'media', nodes: [{ raw: 'and', type: 'logical', value: 'and' }] }],
        ['or', '@media or', { id: 'media', nodes: [{ raw: 'or', type: 'logical', value: 'or' }] }],
        ['not', '@media not', { id: 'media', nodes: [{ raw: 'not', type: 'logical', value: 'not' }] }],
        [',', '@media or', { id: 'media', nodes: [{ raw: ',', type: 'logical', value: 'or' }] }],
        ['!', '@media not', { id: 'media', nodes: [{ raw: '!', type: 'logical', value: 'not' }] }],
        ['&', '@media and', { id: 'media', nodes: [{ raw: '&', type: 'logical', value: 'and' }] }],
    ],
    comparison: [
        ['>=sm', '@media (width>=52.125rem)', {
            id: 'media', nodes: [
                { raw: '>=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }
            ]
        }],
        ['<=sm', '@media (width<=52.125rem)', {
            id: 'media', nodes: [
                { raw: '<=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<=' }
            ]
        }],
        ['>sm', '@media (width>52.125rem)', {
            id: 'media', nodes: [
                { raw: '>sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>' }
            ]
        }],
        ['<sm', '@media (width<52.125rem)', {
            id: 'media', nodes: [
                { raw: '<sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '<' }
            ]
        }],
        ['sm', '@media (width>=52.125rem)', {
            id: 'media', nodes: [
                { raw: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' }
            ]
        }],
        ['=sm', '@media (width=52.125rem)', {
            id: 'media', nodes: [
                { raw: '=sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '=' }
            ]
        }],
    ],
    height: [
        ['height>=sm', '@media (height>=52.125rem)', {
            id: 'media', nodes: [
                { raw: 'height>=sm', type: 'number', name: 'height', value: 52.125, unit: 'rem', operator: '>=' }
            ]
        }],
    ],
    alias: [
        ['w>=sm', '@media (width>=52.125rem)', {
            id: 'media', nodes: [
                { raw: 'w>=sm', type: 'number', name: 'width', value: 52.125, unit: 'rem', operator: '>=' }
            ]
        }],
        ['h>=sm', '@media (height>=52.125rem)', {
            id: 'media', nodes: [
                { raw: 'h>=sm', type: 'number', name: 'height', value: 52.125, unit: 'rem', operator: '>=' }
            ]
        }],
    ],
    container: [
        ['container(h>160)', '@container (height>10rem)', {
            id: 'container', nodes: [
                { raw: 'h>160', name: 'height', type: 'number', value: 10, unit: 'rem', operator: '>' },
            ]
        }],
        ['sidebar(sm)', '@container sidebar (width>=52.125rem)', {
            id: 'container', nodes: [
                { raw: 'sidebar', value: 'sidebar', type: 'string' },
                { raw: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
            ]
        }],
    ],
    complex: [
        ['screen&print', '@media screen and print', {
            id: 'media', nodes: [
                { raw: 'screen', value: 'screen', type: 'string' },
                { raw: '&', type: 'logical', value: 'and' },
                { raw: 'print', value: 'print', type: 'string' }
            ]
        }],
        ['screen,print', '@media screen or print', {
            id: 'media', nodes: [
                { raw: 'screen', value: 'screen', type: 'string' },
                { raw: ',', type: 'logical', value: 'or' },
                { raw: 'print', value: 'print', type: 'string' }
            ]
        }],
        ['!screen', '@media not screen', {
            id: 'media', nodes: [
                { raw: '!', type: 'logical', value: 'not' },
                { raw: 'screen', value: 'screen', type: 'string' }
            ]
        }],
        ['sm&<=lg', '@media (width>=52.125rem) and (width<=80rem)', {
            id: 'media', nodes: [
                { raw: 'sm', name: 'width', type: 'number', value: 52.125, unit: 'rem', operator: '>=' },
                { raw: '&', type: 'logical', value: 'and' },
                { raw: '<=lg', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '<=' }
            ]
        }],
    ],
    'design-token': [
        ['supports-backdrop', '@supports (backdrop-filter:blur(0px))',
            {
                id: 'supports',
                nodes: [
                    {
                        raw: 'supports-backdrop',
                        type: 'group',
                        children: [
                            { type: 'string', value: 'backdrop-filter:blur(0px)' }
                        ]
                    }
                ]
            },
            {
                at: {
                    supports: {
                        backdrop: 'supports(backdrop-filter:blur(0px))'
                    }
                }
            }
        ],
        ['custom', '@media (width>=42mm) and (width<=80mm)',
            {
                id: 'media',
                nodes: [
                    {
                        raw: 'custom',
                        children: [
                            { type: 'number', name: 'width', value: 42, unit: 'mm', operator: '>=' },
                            { type: 'logical', value: 'and' },
                            { type: 'number', name: 'width', value: 80, unit: 'mm', operator: '<=' }
                        ]
                    }
                ]
            },
            {
                at: {
                    custom: '>=42mm&<=80mm'
                }
            }],
        ['custom', '@media (width>=37.5rem)',
            {
                id: 'media',
                nodes: [
                    {
                        raw: 'custom',
                        type: 'number',
                        name: 'width',
                        value: 37.5,
                        unit: 'rem',
                        operator: '>='
                    }
                ]
            },
            {
                at: {
                    custom: '@media(width>=600)'
                }
            }],

        ['desktop', '@media (width>=40rem)',
            {
                id: 'media',
                nodes: [
                    {
                        raw: 'desktop',
                        type: 'number',
                        name: 'width',
                        value: 40,
                        unit: 'rem',
                        operator: '>='
                    }
                ]
            },
            {
                screens: {
                    desktop: 640
                }
            }]
    ],
    errors: [
        ['@media', '@media', {
            id: 'media',
            nodes: []
        }]
    ]
} as Record<string, [string, string, AtRule, Config?][]>

describe.concurrent.each(Object.entries(cases))('%s', (_, caseGroup) => {
    test.concurrent.each(caseGroup)('%s', (input, _, atRule, config) => {
        expect(parseAt(input, createCSS(config))).toEqual(atRule)
    })
})