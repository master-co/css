import { describe, expect, test } from 'vitest'
import { extendConfig } from '../../src'

// describe('variables', () => {
//     test.concurrent('basic', () => {
//         expect(extendConfig(
//             { variables: { a: { '': '#000', b: '#ff0', c: { d: 16 } } } },
//             { variables: { a: '#fff' } }
//         )).toEqual(
//             {
//                 variables: {
//                     'a': {
//                         key: 'a',
//                         name: 'a',
//                         value: '#fff'
//                     },
//                     'a-b': {
//                         key: 'b',
//                         name: 'a-b',
//                         group: 'a',
//                         namespace: 'a',
//                         value: '#ff0'
//                     },
//                     'a-c-d': {
//                         key: 'd',
//                         name: 'a-c-d',
//                         group: 'a.c',
//                         namespace: 'a',
//                         value: 16
//                     }
//                 }
//             }
//         )
//     })
// })

describe('modes', () => {
    test.concurrent('dark mode', () => {
        expect(extendConfig(
            { modes: { dark: { a: '#ffffff' } } },
            { modes: { dark: { a: '$black' } } }
        )).toMatchObject({
            modes: {
                dark: {
                    a: { key: 'a', name: 'a', value: '$black' }
                }
            }
        })
    })
})

// test.concurrent('nest', () => {
//     expect(extendConfig(
//         { variables: { primary: { '': '#000', 1: '#111' } } },
//         { variables: { 'primary-1': '#222' } }
//     )).toEqual(
//         { variables: { primary: { '': '#000', 1: { '': '#111' } }, 'primary-1': { '': '#222' } } }
//     )
// })

// test.concurrent('modes', () => {
//     expect(extendConfig(
//         { modes: { light: { primary: { '': '#111' } }, dark: { primary: { '': '#222' } } } },
//         { modes: { light: { secondary: { '': '#333' } }, dark: { secondary: { '': '#444' } } } }
//     )).toEqual(
//         {
//             modes: {
//                 light: { primary: { '': '#111' }, secondary: { '': '#333' } },
//                 dark: { primary: { '': '#222' }, secondary: { '': '#444' } }
//             }
//         })
// })