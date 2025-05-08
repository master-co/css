import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('font-feature-settings', () => {
    expect(createCSS().create('font-feature:\'cv02\',\'cv03\',\'cv04\',\'cv11\'')?.text).toBe('.font-feature\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
})
