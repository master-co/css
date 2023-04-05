import { testProp } from './css'

test('border', () => {
    testProp('br:1px|solid|gray', 'border-right:1px solid #6b6a6d')
    testProp('br:1|solid|gray', 'border-right:0.0625rem solid #6b6a6d')
})
