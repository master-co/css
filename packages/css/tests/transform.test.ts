import { testCSS, testProp } from './css'

test('transform', () => {
    testCSS('translate(16)', '.translate\\(16\\){transform:translate(1rem)}')
    testCSS('translateY(-5):hover', '.translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
    testCSS('transform:translateY(-5):hover', '.transform\\:translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
})

test('transform-box', ()=> {
    testProp('transform:padding', 'transform-box:padding-box')
})