import { it, expect } from 'vitest'
import { createCSS } from '../../src'
import { variables } from '../../src'

it.concurrent('customizes fonts', () => {
    const css = createCSS({ variables: [{ namespace: 'font-family', key: 'sans', value: '"Inter", $font-family-sans-fallback' }, { namespace: 'font-family', key: 'mono', value: '"Fira Code", $font-family-mono-fallback' }] })
    const defaultVariable = (key: string) => variables.find((variable) => variable.namespace === 'font-family' && variable.key === key)?.value
    expect(css.variables.get('font-family-sans')).toMatchObject({ namespace: 'font-family', group: 'font-family', key: 'sans', name: 'font-family-sans', type: 'string', value: defaultVariable('sans') })
    expect(css.variables.get('font-family-mono')).toMatchObject({ namespace: 'font-family', group: 'font-family', key: 'mono', name: 'font-family-mono', type: 'string', value: '"Fira Code", $font-family-mono-fallback' })
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
