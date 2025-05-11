import Tester, { tester } from './tester'

// tester.priority('generalLayer', {
//     states: [
//         'block',
//         'block:hover',
//         'block:focus',
//         'block:active',
//         'block:disabled'
//     ],
//     breakpoints: [
//         'block',
//         'block@sm',
//         'block@md',
//         'block@lg',
//         'block@xl'
//     ],
//     'rule type': [
//         'gap:16',
//         'p:0',
//         'px:0',
//         'py:0',
//         'gap-x:16',
//         'gap-y:16',
//         'pb:0',
//         'pl:0',
//         'pr:0',
//         'pt:0'
//     ],
//     structure: [
//         'block',
//         'block:hover',
//         'block@dark',
//         'block@light',
//         'block@sm'

//     ],
//     comprehensive: [
//         'block',
//         'block@screen',
//         'block:hover@screen',
//         'block:focus@print',
//         'block:active@screen',
//         'block:disabled@print',
//         // >=sm
//         'block@container(sm)',
//         'block@sm',
//         // >=sm + selector
//         'block:hover@sm',
//         'block:focus@sm',
//         'block:active@sm',
//         'block:disabled@sm',
//         'block@container(md)',
//         // >=md
//         'block@md',
//         // >=md + selector
//         'block:focus@md',
//         'block:active@md',
//         'block:disabled@md',
//         // <=sm
//         'block@<=sm',
//         // <sm
//         'block@!sm',
//         'block@<sm',
//         // range
//         'block@sm&<lg',
//         'block@md&<lg',
//         // @media
//         'block@!(md&<lg)',
//     ]
// })

new Tester({
    components: {
        'btn-primary': 'bg:blue bg:blue:hover bg:blue:disabled'
    }
}).priority('componentsLayer', {
    components: [
        'btn-primary', [
            'bg:blue',
            'bg:blue:hover',
            'bg:blue:disabled'
        ]
    ]
})
