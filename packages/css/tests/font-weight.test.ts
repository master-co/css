import { testCSS, testProp } from '../src/utils/test-css'

test('font-weight', () => {
    testCSS('font:bolder', '.font\\:bolder{font-weight:bolder}')
})
