import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('font-feature-settings', () => {
    expect(createCSSWithTheme().create('font-feature:\'cv02\',\'cv03\',\'cv04\',\'cv11\'')?.text).toBe('.font-feature\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
})
