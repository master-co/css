import { MasterCSS, fonts } from '../../../src'

it('customizes fonts', () => {
    const css = new MasterCSS({
        fonts: {
            sans: ['Inter', ...fonts.sans],
            mono: ['Fira Code', ...fonts.mono]
        }
    })
    expect(css.fonts).toEqual({
        sans: 'Inter,' + fonts.sans.join(','),
        mono: 'Fira Code,' + fonts.mono.join(','),
        serif: fonts.serif.join(',')
    })
})

it('customizes fonts using strings', () => {
    const css = new MasterCSS({
        fonts: {
            sans: 'Inter,ui-sans-serif'
        }
    })
    expect(css.fonts).toEqual({
        sans: 'Inter,ui-sans-serif',
        mono: fonts.mono.join(','),
        serif: fonts.serif.join(',')
    })
})