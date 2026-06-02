import { it, expect } from 'vitest'
import { themeConfig } from '../helpers/create-css-with-theme'
import createCSSWithTheme from '../helpers/create-css-with-theme'

const variables = themeConfig.variables || []

it.concurrent('customizes fonts', () => {
    const css = createCSSWithTheme({ variables: [{ namespace: 'font-family', key: 'sans', value: '"Inter", $font-family-sans-fallback' }, { namespace: 'font-family', key: 'mono', value: '"Fira Code", $font-family-mono-fallback' }] })
    const defaultVariable = (key: string) => variables.find((variable) => variable.namespace === 'font-family' && variable.key === key)?.value
    const sans = css.variables.get('font-family-sans')
    const mono = css.variables.get('font-family-mono')
    expect(sans).toMatchObject({ namespace: 'font-family', key: 'sans', name: 'font-family-sans', type: 'string', value: defaultVariable('sans') })
    expect(sans).not.toHaveProperty('group')
    expect(mono).toMatchObject({ namespace: 'font-family', key: 'mono', name: 'font-family-mono', type: 'string', value: '"Fira Code", $font-family-mono-fallback' })
    expect(mono).not.toHaveProperty('group')
})

// it.concurrent('customizes fonts using strings', () => {
//     const css = createCSSWithTheme({
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
