import { testProp } from '../src/utils/test-css'

test('accent', () => {
    testProp('accent:current', 'accent-color:currentColor')
    testProp('accent:transparent', 'accent-color:transparent')
})
