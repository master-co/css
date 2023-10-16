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
        sans: css.variables['font-family.sans'],
        mono: css.variables['font-family.mono'],
        serif: css.variables['font-family.serif']
    }).toEqual({
        sans: 'Inter,' + variables.fontFamily.sans.join(','),
        mono: 'Fira Code,' + variables.fontFamily.mono.join(','),
        serif: variables.fontFamily.serif.join(',')
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