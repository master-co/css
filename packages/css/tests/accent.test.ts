import { testProp } from './css'

test('accent', () => {
    testProp('accent:current', 'accent-color:currentColor')
    testProp('accent:transparent', 'accent-color:transparent')
})
