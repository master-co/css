import { testCSS, testProp } from './css'

test('text-overflow', () => {
    testProp(['text:clip', 'text-overflow:clip'], 'text-overflow:clip')
})