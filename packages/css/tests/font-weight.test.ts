import { testCSS, testProp } from './test-css'

test('font-weight', () => {
    testCSS('font:bolder', '.font\\:bolder{font-weight:bolder}')
})
