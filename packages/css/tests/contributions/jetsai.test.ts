import { Config } from '../../src/config'
import { extendConfig } from '../../src'

const buttonTokens = Object.freeze({
    primary: '$(button-primary)',
    primaryHover: '$(button-primary-hover)',
    primaryDisabled: '$(button-primary-disabled)',
    disabled: '$(button-disabled)',
    backgroundHover: '$(button-background-hover)'
})

const colorTokens = Object.freeze({
    // blue
    blue200: '$(blue200)',
    blue700: '$(blue700)',
    blue900: '$(blue900)',
    // gray
    gray200: '$(gray200)',
    gray500: '$(gray500)'
})

const textTokens = Object.freeze({
    disabled: '$(text-disabled)',
    onColor: '$(text-on-color)'
})

export const buttonConfig: Config = {
    variables: {
        [buttonTokens.primary.slice(2, -1)]: colorTokens.blue700,
        [buttonTokens.primaryHover.slice(2, -1)]: colorTokens.blue900,
        [buttonTokens.primaryDisabled.slice(2, -1)]: colorTokens.blue200,
        [buttonTokens.disabled.slice(2, -1)]: colorTokens.gray200
    },
    styles: {
        'btn-primary': [
            `t:${textTokens.onColor.slice(2, -1)}`,
            `t:${textTokens.disabled.slice(2, -1)}:disabled`,
            `bg:${buttonTokens.primary.slice(2, -1)}`,
            `bg:${buttonTokens.primaryHover.slice(2, -1)}:hover`,
            `bg:${buttonTokens.primaryDisabled.slice(2, -1)}:disabled`
        ].join(' '),
    }
}

export const colorConfig: Config = {
    variables: {
        // blue
        [colorTokens.blue200.slice(2, -1)]: '#CDE0F7',
        [colorTokens.blue700.slice(2, -1)]: '#2242A3',
        [colorTokens.blue900.slice(2, -1)]: '#152559',
        // gray
        [colorTokens.gray200.slice(2, -1)]: '#E9EEF8',
        [colorTokens.gray500.slice(2, -1)]: '#9297A1'
    }
}

export const textConfig: Config = {
    variables: {
        [textTokens.disabled.slice(2, -1)]: colorTokens.gray500,
        [textTokens.onColor.slice(2, -1)]: '$(white)'
    }
}

const config = extendConfig(colorConfig, textConfig, buttonConfig)

describe('jetsai', () => {

    test('button config', () => {
        expect(new MasterCSS(config).add('bg:button-primary').text)
        .toBe('.bg\\:button-primary,.btn-primary{background-color:rgb(34 66 163)}')

        expect(new MasterCSS(config).add('bg:button-primary-hover').text)
        .toBe('.bg\\:button-primary-hover{background-color:rgb(21 37 89)}')

        expect(new MasterCSS(config).add('bg:button-primary-disabled').text)
        .toBe('.bg\\:button-primary-disabled{background-color:rgb(205 224 247)}')

        expect(new MasterCSS(config).add('bg:button-disabled').text)
        .toBe('.bg\\:button-disabled{background-color:rgb(233 238 248)}')

        expect(new MasterCSS(config).add('bg:button-background-hover').text)
        .toBe('.bg\\:button-background-hover{background:button-background-hover}')

        expect(new MasterCSS(config).add('btn-primary').text)
        .toBe('.bg\\:button-primary,.btn-primary{background-color:rgb(34 66 163)}.t\\:text-on-color,.btn-primary{-webkit-text-fill-color:rgb(255 255 255)}.bg\\:button-primary-hover\\:hover:hover,.btn-primary:hover{background-color:rgb(21 37 89)}.bg\\:button-primary-disabled\\:disabled:disabled,.btn-primary:disabled{background-color:rgb(205 224 247)}.t\\:text-disabled\\:disabled:disabled,.btn-primary:disabled{-webkit-text-fill-color:rgb(146 151 161)}')

    })

    test('color config', () => {
        expect(new MasterCSS(config).add('bg:blue200').text)
        .toBe('.bg\\:blue200{background-color:rgb(205 224 247)}')

        expect(new MasterCSS(config).add('bg:blue700').text)
        .toBe('.bg\\:blue700{background-color:rgb(34 66 163)}')

        expect(new MasterCSS(config).add('bg:blue900').text)
        .toBe('.bg\\:blue900{background-color:rgb(21 37 89)}')

        expect(new MasterCSS(config).add('bg:gray200').text)
        .toBe('.bg\\:gray200{background-color:rgb(233 238 248)}')

        expect(new MasterCSS(config).add('bg:gray500').text)
        .toBe('.bg\\:gray500{background-color:rgb(146 151 161)}')

    })

    test('text config', () => {
        expect(new MasterCSS(config).add('bg:text-disabled').text)
        .toBe('.bg\\:text-disabled{background-color:rgb(146 151 161)}')

        expect(new MasterCSS(config).add('bg:text-on-color').text)
        .toBe('.bg\\:text-on-color{background-color:rgb(255 255 255)}')

    })

})
