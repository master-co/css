import { expect, test } from 'vitest'
import { UtilityType } from '../../../src'
import createCSSWithTheme from '../../helpers/create-css-with-theme'
test.concurrent('layer at-rules can be used in component utilities', () => {
    const css = createCSSWithTheme({
        utilities: [
            {
                name: 'btn',
                type: UtilityType.Static,
                layer: 'components',
                rules: [
                    { selector: '&', atRules: ['@layer preset'], declarations: { display: 'block' } },
                    { selector: '&', atRules: ['@layer base'], declarations: { display: 'inline' } }
                ]
            }
        ]
    }).add('btn')

    expect(css.componentsLayer.text).toContain('@layer preset{.btn{display:block}}')
    expect(css.componentsLayer.text).toContain('@layer base{.btn{display:inline}}')
})
