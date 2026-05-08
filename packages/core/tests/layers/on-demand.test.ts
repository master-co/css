import { expect, test } from 'vitest'
import { createCSS, UtilityType } from '../../src'

test.concurrent('empty', () => {
    const css = createCSS()
    expect(css.text).toBe(css.layerStatementRule.text)
})

test.concurrent('utility', () => {
    const css = createCSS()
    css.add('text:center')
    expect(css.text).toContain(css.layerStatementRule.text)
    expect(css.text).toContain('@layer general{.text\\:center{text-align:center}}')
})

test.concurrent('manipulate', () => {
    const css = createCSS({
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
    expect(css.text).toContain(css.layerStatementRule.text)
    css.add('text:center', 'font:bold')
    expect(css.text).toContain('@layer general{.font\\:bold{font-weight:700}.text\\:center{text-align:center}}')
    css.add('btn')
    expect(css.text).toContain('@layer main{.btn{display:block}')
    css.remove('text:center', 'font:bold', 'btn')
    expect(css.text).toBe(css.layerStatementRule.text)
})

test('prevent duplicate insertion', () => {
    const css = createCSS()
    css.add('text:center', 'text:center')
    expect(css.generalLayer.rules.length).toBe(1)
})
