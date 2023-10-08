import { testCSS, testProp } from './css'

test('stroke-width', () => {
    testProp('stroke:.75!', 'stroke-width:.75!important')
})

test('stroke-color', () => {
    testProp('stroke:current', 'stroke:currentColor')
    testProp('stroke:red', 'stroke:#d11a1e')
})