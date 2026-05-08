import { it, test, expect } from 'vitest'
import { createCSS, UtilityType } from '../../../src'
import config from './master-css'

function getMainRules(css: ReturnType<typeof createCSS>, name: string) {
    return css.config.utilities?.find((definition) =>
        definition.name === name
        && (definition.type ?? UtilityType.Static) === UtilityType.Static
        && (definition.layer ?? 'general') === 'main'
    )?.rules
}

it.concurrent('extendConfig merges config files', () => {
    const css = createCSS(config)
    expect(getMainRules(css, 'blue-btn')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.875rem' } },
        { selector: '&', declarations: { height: '2.5rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } },
        { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
    ])
    expect(getMainRules(css, 'btn')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.875rem' } },
        { selector: '&', declarations: { height: '2.5rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } }
    ])
    expect(getMainRules(css, 'btn3')).toEqual([
        { selector: '&', declarations: { 'font-size': '0.9375rem' } },
        { selector: '&', declarations: { height: '5.625rem' } },
        { selector: '&', declarations: { 'text-align': 'center' } }
    ])
    expect(getMainRules(css, 'btn4')).toEqual([
        { selector: '&', declarations: { 'font-size': '12.5rem' } }
    ])
    expect(css.variables.get('first')).toMatchObject({ name: 'first', key: 'first', type: 'color', space: 'oklch', value: '0.18 0 0' })
    expect(css.variables.get('first')?.modes).toMatchObject({
        dark: { space: 'oklch', value: '0% 0 none' },
        light: { space: 'oklch', value: '0 0 0' }
    })
    expect(css.variables.get('second')).toMatchObject({ type: 'color' })
    expect(css.variables.get('second')?.modes).toMatchObject({
        dark: { space: 'oklch', value: '0% 0 none' },
        light: { space: 'oklch', value: '0 0 0', alpha: .5 }
    })
    expect(css.variables.get('third')).toMatchObject({ type: 'color', space: 'oklch', value: '0% 0 none' })
    expect(css.variables.get('third')?.modes).toMatchObject({ dark: { space: 'oklch', value: '100% 0 none' } })
    expect(css.variables.get('third-2')?.modes).toMatchObject({ dark: { space: 'oklch', value: '100% 0 none' } })
    expect(css.variables.get('fourth')).toMatchObject({ type: 'color', space: 'oklch', value: '0.18 0 0' })
})
