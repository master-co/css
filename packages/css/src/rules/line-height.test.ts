import { testCSS } from '../utils/test-css'

test('line-height', () => {
    testCSS('lh:calc(2-1.5)', '.lh\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
})
