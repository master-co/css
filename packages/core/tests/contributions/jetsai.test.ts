import { Config, utilities, UtilityType } from '../../src'
import { extendConfig } from '../../src'
import CSSTester from '../tester'

const buttonTokens = Object.freeze({
    primary: 'button-primary',
    primaryHover: 'button-primary-hover',
    primaryDisabled: 'button-primary-disabled',
    disabled: 'button-disabled',
    backgroundHover: 'button-background-hover'
})

const colorTokens = Object.freeze({
    // blue
    blue200: 'blue200',
    blue700: 'blue700',
    blue900: 'blue900',
    // gray
    gray200: 'gray200',
    gray500: 'gray500'
})

const textTokens = Object.freeze({
    disabled: 'text-disabled',
    onColor: 'text-on-color'
})

export const buttonConfig: Config = { variables: [
        { namespace: 'color', key: 'white', value: 'oklch(100% 0 none)' },
        { namespace: 'color', key: buttonTokens.primary, value: '$color-' + colorTokens.blue700 },
        { namespace: 'color', key: buttonTokens.primaryHover, value: '$color-' + colorTokens.blue900 },
        { namespace: 'color', key: buttonTokens.primaryDisabled, value: '$color-' + colorTokens.blue200 },
        { namespace: 'color', key: buttonTokens.disabled, value: '$color-' + colorTokens.gray200 }
    ], utilities: [
        {
            name: 'btn-primary',
            type: UtilityType.Static,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { 'background-color': 'rgb(34 66 163)' } },
                { selector: '&', declarations: { '-webkit-text-fill-color': 'oklch(100% 0 none)' } },
                { selector: '&:hover', declarations: { 'background-color': 'rgb(21 37 89)' } },
                { selector: '&:disabled', declarations: { 'background-color': 'rgb(205 224 247)' } },
                { selector: '&:disabled', declarations: { '-webkit-text-fill-color': 'rgb(146 151 161)' } }
            ]
        }
    ] }

export const colorConfig: Config = { variables: [
        { namespace: 'color', key: colorTokens.blue200, value: '#CDE0F7' },
        { namespace: 'color', key: colorTokens.blue700, value: '#2242A3' },
        { namespace: 'color', key: colorTokens.blue900, value: '#152559' },
        { namespace: 'color', key: colorTokens.gray200, value: '#E9EEF8' },
        { namespace: 'color', key: colorTokens.gray500, value: '#9297A1' }
    ] }

export const textConfig: Config = { variables: [{ namespace: 'color', key: textTokens.disabled, value: '$color-' + colorTokens.gray500 }, { namespace: 'color', key: textTokens.onColor, value: '$color-white' }] }

const extendedConfig = extendConfig(colorConfig, textConfig, buttonConfig)

new CSSTester({
    ...extendedConfig,
    utilities: [
        ...(extendedConfig.utilities || []),
        ...utilities
    ]
}, null).layers({
    'bg:button-primary': {
        utilities: '.bg\\:button-primary{background-color:var(--color-button-primary)}'
    },
    'bg:button-primary-hover': {
        utilities: '.bg\\:button-primary-hover{background-color:var(--color-button-primary-hover)}'
    },
    'bg:button-primary-disabled': {
        utilities: '.bg\\:button-primary-disabled{background-color:var(--color-button-primary-disabled)}'
    },
    'bg:button-disabled': {
        utilities: '.bg\\:button-disabled{background-color:var(--color-button-disabled)}'
    },
    'bg:button-background-hover': {
        utilities: '.bg\\:button-background-hover{background:button-background-hover}'
    },
    'bg:blue200': {
        utilities: '.bg\\:blue200{background-color:var(--color-blue200)}'
    },
    'bg:blue700': {
        utilities: '.bg\\:blue700{background-color:var(--color-blue700)}'
    },
    'bg:blue900': {
        utilities: '.bg\\:blue900{background-color:var(--color-blue900)}'
    },
    'bg:gray200': {
        utilities: '.bg\\:gray200{background-color:var(--color-gray200)}'
    },
    'bg:gray500': {
        utilities: '.bg\\:gray500{background-color:var(--color-gray500)}'
    },
    'bg:text-disabled': {
        utilities: '.bg\\:text-disabled{background-color:var(--color-text-disabled)}'
    },
    'bg:text-on-color': {
        utilities: '.bg\\:text-on-color{background-color:var(--color-text-on-color)}'
    },
    'btn-primary': { components: '.btn-primary{background-color:rgb(34 66 163)}.btn-primary{-webkit-text-fill-color:oklch(100% 0 none)}.btn-primary:hover{background-color:rgb(21 37 89)}.btn-primary:disabled{background-color:rgb(205 224 247)}.btn-primary:disabled{-webkit-text-fill-color:rgb(146 151 161)}' },
})
