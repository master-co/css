import { testCSS, testProp } from './css'

test('stroke', () => {
    testProp('stroke:.75!', 'stroke-width:.75!important')
})
