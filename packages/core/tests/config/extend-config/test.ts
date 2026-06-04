import { it, test, expect } from 'vitest'
import { UtilityType } from '../../../src'
import config from './master-css'
import createCSSWithTheme from '../../helpers/create-css-with-theme'

function getComponentRules(css: ReturnType<typeof createCSSWithTheme>, name: string) {
    return css.config.utilities?.find((definition) =>
        definition.name === name
        && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer ?? 'utilities') === 'components'
    )?.rules
}

it.concurrent('extendConfig merges config files', () => {
    const css = createCSSWithTheme(config)
    expect(getComponentRules(css, 'blue-btn')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.875rem' } },
        { selector: '&', declarations: { height: '2.5rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } },
        { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
    ])
    expect(getComponentRules(css, 'btn')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.875rem' } },
        { selector: '&', declarations: { height: '2.5rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } }
    ])
    expect(getComponentRules(css, 'btn3')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.9375rem' } },
        { selector: '&', declarations: { height: '5.625rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } }
    ])
    expect(getComponentRules(css, 'btn4')).toEqual([
        { selector: '&', declarations: { 'font-size': '12.5rem' } }
    ])
    expect(css.variables.get('first')).toMatchObject({ name: 'first', key: 'first', type: 'string', value: 'oklch(0.18 0 0)' })
    expect(css.variables.get('first')?.modes).toMatchObject({
        dark: { value: '$color-black' },
        light: { value: 'oklch(0,0,0)' }
    })
    expect(css.variables.get('second')).toMatchObject({ type: 'string' })
    expect(css.variables.get('second')?.modes).toMatchObject({
        dark: { value: '$color-black' },
        light: { value: 'oklch(0 0 0/.5)' }
    })
    expect(css.variables.get('third')).toMatchObject({ type: 'string', value: '$color-black' })
    expect(css.variables.get('third')?.modes).toMatchObject({ dark: { value: '$color-white' } })
    expect(css.variables.get('third-2')?.modes).toMatchObject({ dark: { value: '$color-white' } })
    expect(css.variables.get('fourth')).toMatchObject({ type: 'string', value: '$first' })
})
