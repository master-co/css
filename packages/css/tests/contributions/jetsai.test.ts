import { Config } from '../../src/config'
import { extend } from '../../src'
import { testCSS } from '../css'

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

const config = extend(colorConfig, textConfig, buttonConfig)

describe('jetsai', () => {

    test('button config', () => {
        testCSS(
            'bg:button-primary',
            '.bg\\:button-primary,.btn-primary{background-color:rgb(34 66 163)}',
            config
        )
        testCSS(
            'bg:button-primary-hover',
            '.bg\\:button-primary-hover{background-color:rgb(21 37 89)}',
            config
        )
        testCSS(
            'bg:button-primary-disabled',
            '.bg\\:button-primary-disabled{background-color:rgb(205 224 247)}',
            config
        )
        testCSS(
            'bg:button-disabled',
            '.bg\\:button-disabled{background-color:rgb(233 238 248)}',
            config
        )
        testCSS(
            'bg:button-background-hover',
            '.bg\\:button-background-hover{background:button-background-hover}',
            config
        )
        testCSS(
            'btn-primary',
            '.bg\\:button-primary,.btn-primary{background-color:rgb(34 66 163)}.t\\:text-on-color,.btn-primary{-webkit-text-fill-color:rgb(255 255 255)}.bg\\:button-primary-hover\\:hover:hover,.btn-primary:hover{background-color:rgb(21 37 89)}.bg\\:button-primary-disabled\\:disabled:disabled,.btn-primary:disabled{background-color:rgb(205 224 247)}.t\\:text-disabled\\:disabled:disabled,.btn-primary:disabled{-webkit-text-fill-color:rgb(146 151 161)}',
            config
        )
    })

    test('color config', () => {
        testCSS(
            'bg:blue200',
            '.bg\\:blue200{background-color:rgb(205 224 247)}',
            config
        )
        testCSS(
            'bg:blue700',
            '.bg\\:blue700{background-color:rgb(34 66 163)}',
            config
        )
        testCSS(
            'bg:blue900',
            '.bg\\:blue900{background-color:rgb(21 37 89)}',
            config
        )
        testCSS(
            'bg:gray200',
            '.bg\\:gray200{background-color:rgb(233 238 248)}',
            config
        )
        testCSS(
            'bg:gray500',
            '.bg\\:gray500{background-color:rgb(146 151 161)}',
            config
        )
    })

    test('text config', () => {
        testCSS(
            'bg:text-disabled',
            '.bg\\:text-disabled{background-color:rgb(146 151 161)}',
            config
        )
        testCSS(
            'bg:text-on-color',
            '.bg\\:text-on-color{background-color:rgb(255 255 255)}',
            config
        )
    })

})
