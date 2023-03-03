import { testCSS, testProp } from './test-css'

test('font-feature-settings', () => {
    testCSS('font-feature:\'cv02\',\'cv03\',\'cv04\',\'cv11\'', '.font-feature\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
})
