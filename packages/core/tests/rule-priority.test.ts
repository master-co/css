import Testing from './cases-testing'

Testing.priority({
    states: [
        'block',
        'block:hover',
        'block:focus',
        'block:active',
        'block:disabled'
    ],
    breakpoints: [
        'block',
        'block@sm',
        'block@md',
        'block@lg',
        'block@xl'
    ],
    'rule type': [
        'gap:16',
        'p:0',
        'px:0',
        'py:0',
        'gap-x:16',
        'gap-y:16',
        'pb:0',
        'pl:0',
        'pr:0',
        'pt:0'
    ],
    structure: [
        'block',
        'block:hover',
        'block@dark',
        'block@light',
        'block@sm'

    ],
    components: [
        'btn-primary', [
            'bg:blue',
            'bg:blue:hover',
            'bg:blue:disabled'
        ], {
            components: {
                'btn-primary': 'bg:blue bg:blue:hover bg:blue:disabled'
            }
        }
    ],
    comprehensive: [
        'block',
        'block@screen',
        'block:hover@screen',
        'block:focus@print',
        'block:active@screen',
        'block:disabled@print',
        // >=sm
        'block@container(sm)',
        'block@sm',
        // >=sm + selector
        'block:hover@sm',
        'block:focus@sm',
        'block:active@sm',
        'block:disabled@sm',
        'block@container(md)',
        // >=md
        'block@md',
        // >=md + selector
        'block:focus@md',
        'block:active@md',
        'block:disabled@md',
        // <=sm
        'block@<=sm',
        // <sm
        'block@!sm',
        'block@<sm',
        // range
        'block@sm&<lg',
        'block@md&<lg',
        // @media
        'block@!(md&<lg)',
    ]
})

// draft
const input = [
    // min
    { token: '>=sm', media: [{ token: '>=sm', name: 'width', type: 'number', value: 1, unit: 'rem', operator: '>=' }] },
    { token: ':hover>=sm', media: [{ token: '>=sm', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }], selectorNodes: [':hover'] },
    { token: ':focus>=sm', media: [{ token: '>=sm', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }], selectorNodes: [':focus'] },
    { token: ':active>=sm', media: [{ token: '>=sm', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }], selectorNodes: [':active'] },
    { token: ':disabled>=sm', media: [{ token: '>=sm', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }], selectorNodes: [':disabled'] },
    { token: '>=md', media: [{ token: '>=md', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }] },
    { token: '>=lg', media: [{ token: '>=lg', name: 'width', type: 'number', value: 4, unit: 'rem', operator: '>=' }] },
    {
        token: '(>=xl&landscape)', media: [{
            type: 'group', children: [
                { token: '>=xl', name: 'width', type: 'number', value: 4, unit: 'rem', operator: '>=' },
                { token: '&', type: 'logical', value: 'and' },
                { token: 'landscape', name: 'orientation', type: 'string', value: 'landscape' }
            ]
        }]
    },
    // max
    { token: '<=sm', media: [{ token: '<=sm', name: 'width', type: 'number', value: 1, unit: 'rem', operator: '<=' }] },
    { token: '<sm', media: [{ token: '<sm', name: 'width', type: 'number', value: 1, unit: 'rem', operator: '<' }] },
    {
        token: '!md', media: [
            { token: '!', type: 'logical', value: 'not' },
            { token: '>=md', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' }]
    },
    { token: '<=md', media: [{ token: '<=md', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '<=' }] },
    { token: '<=xl', media: [{ token: '<=xl', name: 'width', type: 'number', value: 4, unit: 'rem', operator: '<=' }] },
    // range
    {
        token: '>=md&<=lg',
        media: [
            { token: '>=md', name: 'width', type: 'number', value: 2, unit: 'rem', operator: '>=' },
            { token: '&', type: 'logical', value: 'and' },
            { token: '<=lg', name: 'width', type: 'number', value: 3, unit: 'rem', operator: '<=' }
        ]
    },
    {
        token: '>=sm&<=xl',
        media: [
            { token: '>=sm', name: 'width', type: 'number', value: 1, unit: 'rem', operator: '>=' },
            { token: '&', type: 'logical', value: 'and' },
            { token: '<=xl', name: 'width', type: 'number', value: 4, unit: 'rem', operator: '<=' }
        ]
    },
]

const expect = [
    '(>=xl&landscape)',
    '>=md',
    ':hover>=sm',
    ':focus>=sm',
    ':active>=sm',
    ':disabled>=sm',
    '>=sm',
    '<=lg',
    '<=md',
    '!md',
    '<=sm',
    '<sm',
    '>=sm&<=xl',
    '>=md&<=lg',
]