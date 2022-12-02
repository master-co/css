import { testCSS, testProp } from '../src/utils/test-css'

test('overflow', () => {
    testProp('overflow', 'overflow:visible')
    testProp('overflow:hidden', 'overflow:hidden')
    testProp('overflow:$(overflow)', 'overflow:var(--overflow)')
    testCSS('overflow:hover', '.overflow\\:hover:hover{overflow:visible}')
})
