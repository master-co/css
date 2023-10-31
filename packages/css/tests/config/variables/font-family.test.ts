import { MasterCSS, variables } from '../../../src'

it('customizes fonts', () => {
    const css = new MasterCSS({
        variables: {
            fontFamily: {
                sans: ['Inter', ...variables.fontFamily.sans],
                mono: ['Fira Code', ...variables.fontFamily.mono]
            }
        }
    })
    expect({
        sans: css.normalVariables['fontFamily-sans'],
        mono: css.normalVariables['fontFamily-mono'],
        serif: css.normalVariables['fontFamily-serif']
    }).toEqual({
        sans: { type: 'string', value: 'Inter,' + variables.fontFamily.sans.join(',') },
        mono: { type: 'string', value: 'Fira Code,' + variables.fontFamily.mono.join(',') },
        serif: { type: 'string', value: variables.fontFamily.serif.join(',') }
    })
})

// it('customizes fonts using strings', () => {
//     const css = new MasterCSS({
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