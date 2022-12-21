import { Config } from '../../src/config'
import { extend } from '../../src'
import { testCSS } from '../../src/utils/test-css'

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

export const buttonConfig: Config = {
	colors: {
		[buttonTokens.primary]: colorTokens.blue700,
		[buttonTokens.primaryHover]: colorTokens.blue900,
		[buttonTokens.primaryDisabled]: colorTokens.blue200,
		[buttonTokens.disabled]: colorTokens.gray200
	},
	classes: {
		'btn-primary': [
			`t:${textTokens.onColor}`,
			`t:${textTokens.disabled}:disabled`,
			`bg:${buttonTokens.primary}`,
			`bg:${buttonTokens.primaryHover}:hover`,
			`bg:${buttonTokens.primaryDisabled}:disabled`
		].join(' '),
	}
}

export const colorConfig: Config = {
	colors: {
		// blue
		[colorTokens.blue200]: '#CDE0F7',
		[colorTokens.blue700]: '#2242A3',
		[colorTokens.blue900]: '#152559',
		// gray
		[colorTokens.gray200]: '#E9EEF8',
		[colorTokens.gray500]: '#9297A1'
	}
}

export const textConfig: Config = {
	colors: {
		[textTokens.disabled]: colorTokens.gray500,
		[textTokens.onColor]: 'white'
	}
}

const config =  extend(colorConfig, textConfig, buttonConfig)

test('jetsai button config', () => {
    testCSS(
        'bg:button-primary',
        '.bg\\:button-primary,.btn-primary{background-color:#2242A3}',
        config
    )
    testCSS(
        'bg:button-primary-hover',
        '.bg\\:button-primary-hover{background-color:#152559}',
        config
    )
    testCSS(
        'bg:button-primary-disabled',
        '.bg\\:button-primary-disabled{background-color:#CDE0F7}',
        config
    )
    testCSS(
        'bg:button-disabled',
        '.bg\\:button-disabled{background-color:#E9EEF8}',
        config
    )
    testCSS(
        'bg:button-background-hover',
        '.bg\\:button-background-hover{background:button-background-hover}',
        config
    )
    testCSS(
        'btn-primary',
        '.bg\\:button-primary,.btn-primary{background-color:#2242A3}.t\\:text-on-color,.btn-primary{-webkit-text-fill-color:#ffffff}.bg\\:button-primary-hover\\:hover:hover,.btn-primary:hover{background-color:#152559}.bg\\:button-primary-disabled\\:disabled:disabled,.btn-primary:disabled{background-color:#CDE0F7}.t\\:text-disabled\\:disabled:disabled,.btn-primary:disabled{-webkit-text-fill-color:#9297A1}',
        config
    )
})

test('jetsai color config', () => {
    testCSS(
        'bg:blue200',
        '.bg\\:blue200{background-color:#CDE0F7}',
        config
    )
    testCSS(
        'bg:blue700',
        '.bg\\:blue700{background-color:#2242A3}',
        config
    )
    testCSS(
        'bg:blue900',
        '.bg\\:blue900{background-color:#152559}',
        config
    )
    testCSS(
        'bg:gray200',
        '.bg\\:gray200{background-color:#E9EEF8}',
        config
    )
    testCSS(
        'bg:gray500',
        '.bg\\:gray500{background-color:#9297A1}',
        config
    )
})

test('jetsai text config', () => {
    testCSS(
        'bg:text-disabled',
        '.bg\\:text-disabled{background-color:#9297A1}',
        config
    )
    testCSS(
        'bg:text-on-color',
        '.bg\\:text-on-color{background-color:#ffffff}',
        config
    )
})

