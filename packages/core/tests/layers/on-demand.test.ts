import { expect, test } from 'vitest'
import { createCSS, UtilityType } from '../../src'
import createCSSWithTheme, { createThemeConfig } from '../helpers/create-css-with-theme'
test.concurrent('empty', () => {
    const css = createCSSWithTheme()
    expect(css.text).toBe('')
})

test.concurrent('utility', () => {
    const css = createCSSWithTheme()
    css.add('text:center')
    expect(css.text).toContain('@layer utilities{.text\\:center{text-align:center}}')
})

test.concurrent('manipulate', () => {
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [
                    { selector: '&', declarations: { display: 'block' } }
                ]
            }
        ]
    })
    css.add('text:center', 'font:bold')
    expect(css.text).toContain('@layer theme{:root{--font-weight-bold:700}}')
    expect(css.text).toContain('@layer utilities{.font\\:bold{font-weight:var(--font-weight-bold)}.text\\:center{text-align:center}}')
    css.add('btn')
    expect(css.text).toContain('@layer components{.btn{display:block}')
    css.remove('text:center', 'font:bold', 'btn')
    expect(css.text).toBe('')
})

test('prevent duplicate insertion', () => {
    const css = createCSSWithTheme()
    css.add('text:center', 'text:center')
    expect(css.utilitiesLayer.rules.length).toBe(1)
})

test.concurrent('does not duplicate preloaded variables', () => {
    const css = createCSS(createThemeConfig(), {
        variables: {
            'color-red-60': 1
        }
    })
    css.add('bg:red-60')
    expect(css.text).toBe('@layer utilities{.bg\\:red-60{background-color:var(--color-red-60)}}')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
        'color-red-60': 2
    })
    css.remove('bg:red-60')
    expect(css.text).toBe('')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
        'color-red-60': 1
    })
})
