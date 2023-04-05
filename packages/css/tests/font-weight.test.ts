import { testCSS, testProp } from './css'

test('font-weight', () => {
    testCSS('font:bolder', '.font\\:bolder{font-weight:bolder}')
})
