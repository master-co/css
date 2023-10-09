import { testProp } from './css'

test('oreder', () => {
    testProp(['order:1', 'o:1'], 'order:1')
})
