import { testCSS } from './css'
import MasterCSS, { fonts, rules } from '../src'

it('font', () => {
    testCSS('font:italic|1.2rem|sans', `.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem ${fonts.sans.join(',')}}`)
    testCSS('font:italic|semibold|1.2rem|sans', `.font\\:italic\\|semibold\\|1\\.2rem\\|sans{font:italic 600 1.2rem ${fonts.sans.join(',')}}`)
})

// it('checks font-related orders', () => {
//     const css = new MasterCSS()
//     expect(css.orders.Font).toBeLessThan(css.orders.FontSize)
//     expect(css.orders.Font).toBeLessThan(css.orders.FontStyle)
//     expect(css.orders.Font).toBeLessThan(css.orders.FontWeight)
//     expect(css.orders.Font).toBeLessThan(css.orders.LineHeight)
// })

it('font values', () => {
    const css = new MasterCSS()
    expect(css.values.font).toEqual({
        ...css.values.fontSize,
        ...css.values.fontStyle,
        ...css.values.fontWeight,
        ...css.values.lineHeight,
        ...css.fonts
    })
})
