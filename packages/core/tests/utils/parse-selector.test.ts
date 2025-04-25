import { test, expect, describe } from 'vitest'
import { Config, parseSelector } from '../../src/'
import { SelectorNode } from '../../src/utils/parse-selector'

export const cases = {
    basic: [
        ['.class', '.class', [{ type: 'class', raw: '.class', value: 'class' }]],
        [':hover', ':hover', [{ type: 'pseudo-class', raw: ':hover', value: 'hover' }]],
        ['::placeholder', '::placeholder', [{ type: 'pseudo-element', raw: '::placeholder', value: 'placeholder' }]],
        ['[open]', '[open]', [{ type: 'attribute', raw: '[open]', value: 'open' }]],
        [':has(.active)', ':has(.active)', [{
            type: 'pseudo-class', raw: ':has', value: 'has', children: [
                { type: 'class', raw: '.active', value: 'active' }
            ]
        }]],
    ],
    of: [
        [':of(.active)', '.active ', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'class', raw: '.active', value: 'active' }
            ]
        }]],
        [':of(#active)', '#active ', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'id', raw: '#active', value: 'active' },
            ]
        }]],
        [':of(active)', 'active ', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { raw: 'active', value: 'active' },
            ]
        }]],
        [':of(.active_)', '.active ', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'class', raw: '.active', value: 'active' },
                { type: 'combinator', raw: '_', value: ' ' }
            ]
        }]],
        [':of(.active>)', '.active>', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'class', raw: '.active', value: 'active' },
                { type: 'combinator', raw: '>', value: '>' }
            ]
        }]],
        [':of(.active+)', '.active+', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'class', raw: '.active', value: 'active' },
                { type: 'combinator', raw: '+', value: '+' }
            ]
        }]],
        [':of(.active~)', '.active~', [{
            type: 'pseudo-class', raw: ':of', value: 'of', children: [
                { type: 'class', raw: '.active', value: 'active' },
                { type: 'combinator', raw: '~', value: '~' }
            ]
        }]]
    ],
    compound: [
        [':first:focus:disabled', ':first-child:focus:disabled', [
            { type: 'pseudo-class', raw: ':first', value: 'first-child' },
            { type: 'pseudo-class', raw: ':focus', value: 'focus' },
            { type: 'pseudo-class', raw: ':disabled', value: 'disabled' }
        ]],
    ],
    combinators: [
        ['>span', '>span', [
            { type: 'combinator', raw: '>', value: '>' },
            { raw: 'span', value: 'span' }
        ]],
        ['_span', ' span', [
            { type: 'combinator', raw: '_', value: ' ' },
            { raw: 'span', value: 'span' }
        ]],
    ],
    universal: [
        ['*', '*', [{ type: 'universal', raw: '*', value: '*' }]],
        ['_hr+*', ' hr+*', [
            { type: 'combinator', raw: '_', value: ' ' },
            { raw: 'hr', value: 'hr' },
            { type: 'combinator', raw: '+', value: '+' },
            { type: 'universal', raw: '*', value: '*' }
        ]],
    ],
    complex: [
        [':hover+div:has(:active)', ':hover+div:has(:active)', [
            { type: 'pseudo-class', raw: ':hover', value: 'hover' },
            { type: 'combinator', raw: '+', value: '+' },
            { raw: 'div', value: 'div' },
            {
                type: 'pseudo-class',
                raw: ':has',
                value: 'has', children: [
                    { type: 'pseudo-class', raw: ':active', value: 'active' }
                ]
            }
        ]]
    ],
    multiple: [
        ['>li::before,>li::after', '.block>li::before,.block>li::after', [
            { type: 'combinator', raw: '>', value: '>' },
            { raw: 'li', value: 'li' },
            { type: 'pseudo-element', raw: '::before', value: 'before' },
            { type: 'separator', raw: ',', value: ',' },
            { type: 'combinator', raw: '>', value: '>' },
            { raw: 'li', value: 'li' },
            { type: 'pseudo-element', raw: '::after', value: 'after' }
        ], {}, '.block'],
    ],
    'design token': [
        [':rtl', ':dir(rtl)', [{
            type: 'pseudo-class',
            raw: ':rtl',
            value: 'dir',
            children: [{
                value: 'rtl'
            }]
        }]],
        [':nth(2)', ':nth-child(2)', [{
            type: 'pseudo-class',
            raw: ':nth',
            value: 'nth-child',
            children: [{
                raw: '2', value: '2',
            }]
        }]],
        [':first', ':first-child', [{
            type: 'pseudo-class',
            raw: ':first',
            value: 'first-child'
        }]],
        [':has(:first)', ':has(:first-child)', [{
            type: 'pseudo-class',
            raw: ':has',
            value: 'has',
            children: [
                {
                    type: 'pseudo-class',
                    raw: ':first',
                    value: 'first-child'
                }
            ]
        }]],
        ['_:headings', ' :is(h1,h2,h3)', [
            { type: 'combinator', raw: '_', value: ' ' },
            {
                type: 'pseudo-class',
                raw: ':headings',
                value: 'is',
                children: [
                    { value: 'h1' },
                    { type: 'separator', value: ',' },
                    { value: 'h2' },
                    { type: 'separator', value: ',' },
                    { value: 'h3' }
                ]
            },
        ],
            {
                selectors: {
                    ':headings': ':is(h1,h2,h3)',
                }
            }
        ],
        [':combo', ':is(h1,h2)+div', [
            {
                children: [
                    {
                        type: 'pseudo-class',
                        value: 'is',
                        children: [
                            { value: 'h1' },
                            { type: 'separator', value: ',' },
                            { value: 'h2' },
                        ]
                    },
                    { type: 'combinator', value: '+' },
                    { value: 'div' }
                ],
                raw: ':combo'
            },
        ],
            {
                selectors: {
                    ':combo': ':is(h1,h2)+div',
                }
            }
        ],
        // unsupported: component token + selector token
        // ['>span::both', '.btn>span::before,.btn>span::after', [
        //     { type: 'combinator', raw: '>', value: '>' },
        //     { raw: 'span', value: 'span' },
        //     {
        //         raw: '::both', children: [
        //             { type: 'pseudo-element', value: 'before' },
        //             { type: 'separator', value: ',' },
        //             { type: 'pseudo-element', value: 'after' }
        //         ]
        //     }
        // ],
        //     {
        //         selectors: {
        //             '::both': '::before,::after',
        //         },
        //         components: {
        //             'btn': 'block::both'
        //         }
        //     },
        //     '.btn'
        // ]
    ]
} as Record<string, [string, string, SelectorNode[], Config?, string?][]>

describe.concurrent.each(Object.entries(cases))('%s', (_, cases) => {
    test.concurrent.each(cases)('%s', (raw, _, nodes, config) => {
        expect(parseSelector(raw, new MasterCSS(config))).toEqual(nodes)
    })
})
