import { testCSS, testProp } from '../utils/test-css'

test('font-weight', () => {
    testCSS('font:bolder', '.font\\:bolder{font-weight:bolder}')
})
