import { MasterCSS, variables } from '../../src'

it('customizes fonts', () => {
    const css = new MasterCSS({
        variables: {
            font: {
                family: {
                    sans: ['Inter', ...variables['font-family'].sans],
                    mono: ['Fira Code', ...variables['font-family'].mono]
                }
            }
        }
    })
    expect({
        sans: css.variables['font-family-sans'],
        mono: css.variables['font-family-mono'],
        serif: css.variables['font-family-serif']
    }).toEqual({
        sans: { type: 'string', value: 'Inter,' + variables['font-family'].sans.join(',') },
        mono: { type: 'string', value: 'Fira Code,' + variables['font-family'].mono.join(',') },
        serif: { type: 'string', value: variables['font-family'].serif.join(',') }
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