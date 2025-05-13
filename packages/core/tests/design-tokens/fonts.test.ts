import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'
import { variables } from '../../src'

it.concurrent('customizes fonts', () => {
    const css = createCSS({
        variables: {
            'font-family': {
                sans: ['Inter', ...variables['font-family'].sans],
                mono: ['Fira Code', ...variables['font-family'].mono]
            }
        }
    })
    expect({
        sans: css.variables.get('font-family-sans'),
        mono: css.variables.get('font-family-mono'),
        serif: css.variables.get('font-family-serif')
    }).toEqual({
        sans: { namespace: 'font-family', group: 'font-family', key: 'sans', name: 'font-family-sans', type: 'string', value: 'Inter,' + variables['font-family'].sans.join(',') },
        mono: { namespace: 'font-family', group: 'font-family', key: 'mono', name: 'font-family-mono', type: 'string', value: 'Fira Code,' + variables['font-family'].mono.join(',') },
        serif: { namespace: 'font-family', group: 'font-family', key: 'serif', name: 'font-family-serif', type: 'string', value: variables['font-family'].serif.join(',') }
    })
})

// it.concurrent('customizes fonts using strings', () => {
//     const css = createCSS({
//         variables: {
//             fontFamily: {
//                 sans: 'Inter,ui-sans-serif'
//             }
//         }
//     })
//     expect(css.fonts).toEqual({
//         sans: 'Inter,ui-sans-serif',
//         mono: variables.fontFamily.mono.join(','),
//         serif: variables.fontFamily.serif.join(',')
//     })
// })