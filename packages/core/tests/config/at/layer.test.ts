import { expect, test } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('layer at-rules can be used in component utilities', () => {
    const css = createCSS({ components: { btn: [
        { selector: '&', atRules: ['@layer preset'], declarations: { display: 'block' } },
        { selector: '&', atRules: ['@layer base'], declarations: { display: 'inline' } }
    ] } }).add('btn')

    expect(css.componentsLayer.text).toContain('@layer preset{.btn{display:block}}')
    expect(css.componentsLayer.text).toContain('@layer base{.btn{display:inline}}')
})
