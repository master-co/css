import { Config, rules } from '../../src'
import { extendConfig } from '../../src'
import CSSTester from '../tester'

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
    components: {
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

new CSSTester({
    ...config,
    rules
}, null).layers({
    'bg:button-primary': {
        general: '.bg\\:button-primary{background-color:rgb(34 66 163)}'
    }
})

//     expectLayers(
//         {
//             general: '.bg\\:button-primary-hover{background-color:rgb(21 37 89)}'
//         },
//         'bg:button-primary-hover',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:button-primary-disabled{background-color:rgb(205 224 247)}'
//         },
//         'bg:button-primary-disabled',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:button-disabled{background-color:rgb(233 238 248)}'
//         },
//         'bg:button-disabled',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:button-background-hover{background:button-background-hover}'
//         },
//         'bg:button-background-hover',
//         config
//     )

//     expectLayers(
//         {
//             components: '.btn-primary{background-color:rgb(34 66 163)}.btn-primary{-webkit-text-fill-color:oklch(100% 0 none)}.btn-primary:hover{background-color:rgb(21 37 89)}.btn-primary:disabled{background-color:rgb(205 224 247)}.btn-primary:disabled{-webkit-text-fill-color:rgb(146 151 161)}'
//         },
//         'btn-primary',
//         config
//     )
// })

// test.concurrent('color config', () => {
//     expectLayers(
//         {
//             general: '.bg\\:blue200{background-color:rgb(205 224 247)}'
//         },
//         'bg:blue200',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:blue700{background-color:rgb(34 66 163)}'
//         },
//         'bg:blue700',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:blue900{background-color:rgb(21 37 89)}'
//         },
//         'bg:blue900',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:gray200{background-color:rgb(233 238 248)}'
//         },
//         'bg:gray200',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:gray500{background-color:rgb(146 151 161)}'
//         },
//         'bg:gray500',
//         config
//     )
// })

// test.concurrent('text config', () => {
//     expectLayers(
//         {
//             general: '.bg\\:text-disabled{background-color:rgb(146 151 161)}'
//         },
//         'bg:text-disabled',
//         config
//     )

//     expectLayers(
//         {
//             general: '.bg\\:text-on-color{background-color:oklch(100% 0 none)}'
//         },
//         'bg:text-on-color',
//         config
//     )