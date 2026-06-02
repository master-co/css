import { expect, test } from 'vitest'
import { UtilityType } from '../../src'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('empty', () => {
    const css = createCSSWithTheme()
    expect(css.text).toBe('')
})

test.concurrent('utility', () => {
    const css = createCSSWithTheme()
    css.add('text:center')
    expect(css.text).toContain('@layer general{.text\\:center{text-align:center}}')
})

test.concurrent('manipulate', () => {
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'main',
                rules: [
                    { selector: '&', declarations: { display: 'block' } }
                ]
            }
        ]
    })
    css.add('text:center', 'font:bold')
    expect(css.text).toContain('@layer theme{:root{--font-weight-bold:700}}')
    expect(css.text).toContain('@layer general{.font\\:bold{font-weight:var(--font-weight-bold)}.text\\:center{text-align:center}}')
    css.add('btn')
    expect(css.text).toContain('@layer main{.btn{display:block}')
    css.remove('text:center', 'font:bold', 'btn')
    expect(css.text).toBe('')
})

test('prevent duplicate insertion', () => {
    const css = createCSSWithTheme()
    css.add('text:center', 'text:center')
    expect(css.generalLayer.rules.length).toBe(1)
})
