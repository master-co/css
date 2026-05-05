import { expect, test } from 'vitest'
import { createCSS } from '../../../src'

test.concurrent('layer at-rules can be used in component utilities', () => {
    const css = createCSS({ components: { btn: ['block@preset', 'inline@base'] } }).add('btn')

    expect(css.componentsLayer.text).toContain('@layer preset{.btn{display:block}}')
    expect(css.componentsLayer.text).toContain('@layer base{.btn{display:inline}}')
})
