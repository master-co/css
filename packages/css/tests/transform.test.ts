import { testCSS, testProp } from './css'

test('transform', () => {
    testProp('translate(16)', 'transform:translate(1rem)')
    testCSS('translateY(-5):hover', '.translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
})
