import { testProp } from './css'

test('box', () => {
    testProp(['box:content', 'box-sizing:content-box'], 'box-sizing:content-box')
})