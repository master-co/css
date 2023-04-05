import { testProp } from './css'

test('caret', () => {
    testProp('caret:current', 'caret-color:currentColor')
    testProp('caret:transparent', 'caret-color:transparent')
})
