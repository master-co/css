import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'

// describe.concurrent('scope', () => {
//     test.concurrent('font:medium', () => expect(hint('font:')?.map(({ label }) => label)).toContain('semibold'))
//     test.concurrent('font:sans', () => expect(hint('font:')?.map(({ label }) => label)).toContain('semibold'))
//     test.concurrent('fg:blue', () => expect(hint('fg:')?.find(({ label }) => label === 'blue')).toMatchObject({
//         'detail': '(scope) text-blue',
//         'kind': 16,
//         'label': 'blue',
//         'sortText': 'aaaablue',
//     }))
//     test.concurrent('box-content', () => expect(hint('box:')?.find(({ label }) => label === 'content')).toEqual({
//         'detail': '(scope) content-box',
//         'kind': 12,
//         'label': 'content',
//         'sortText': 'aaaacontent',
//         'documentation': {
//             'kind': 'markdown',
//             'value': dedent`
//                     \`\`\`css
//                     @layer general {
//                       .box\\:content {
//                         box-sizing: content-box
//                       }
//                     }
//                     \`\`\`

//                     Specifies the behavior of the 'width' and 'height' properties\\.

//                     (Edge 12, Firefox 29,  29, Safari 5,  6, Chrome 10,  18, IE 8, Opera 7)

//                     Syntax: content\\-box | border\\-box

//                     [Master CSS](https://rc.css.master.co/reference/box-sizing) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/box-sizing)
//                 `}
//     }))
// })

// describe.concurrent('global', () => {
//     test.concurrent('fg:yellow-30', () => expect(hint('fg:')?.map(({ label }) => label)).toContain('yellow-30'))
// })

// describe.concurrent('scope and global', () => {
//     test.concurrent('scope', () => expect(hint('fg:')?.find(({ label }) => label === 'blue')).toMatchObject({
//         'detail': '(scope) text-blue',
//         'kind': 16,
//         'label': 'blue',
//         'sortText': 'aaaablue',
//     }))
//     test.concurrent('global and scope collide', () => expect(hint('fg:')?.find(({ label }) => label === '$(blue)')).toMatchObject({
//         'detail': '(global) blue',
//         'kind': 16,
//         'label': '$(blue)',
//         'sortText': 'zzzz$(blue)',
//     }))
// })

describe.concurrent('sorting', () => {
    test.concurrent('positive screen', () => {
        expect(
            hint('w:screen-')
                ?.filter(({ label }) => label.startsWith('screen-'))
                ?.map(({ label }) => label)
        ).toEqual([
            'screen-4xs',
            'screen-3xs',
            'screen-2xs',
            'screen-xs',
            'screen-sm',
            'screen-md',
            'screen-lg',
            'screen-xl',
            'screen-2xl',
            'screen-3xl',
            'screen-4xl',
        ])
    })
    test.concurrent('negative screen', () => {
        expect(
            hint('w:-screen-')
                ?.filter(({ label }) => label.startsWith('-screen-'))
                ?.map(({ label }) => label)
        ).toEqual([
            '-screen-4xs',
            '-screen-3xs',
            '-screen-2xs',
            '-screen-xs',
            '-screen-sm',
            '-screen-md',
            '-screen-lg',
            '-screen-xl',
            '-screen-2xl',
            '-screen-3xl',
            '-screen-4xl',
        ])
    })
})