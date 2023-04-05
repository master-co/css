import { testCSS, testProp } from './css'

test('overflow', () => {
    testProp('overflowed', 'overflow:visible')
    testProp('overflow:hidden', 'overflow:hidden')
    testProp('overflow:$(overflow)', 'overflow:var(--overflow)')
    testCSS('overflowed:hover', '.overflowed\\:hover:hover{overflow:visible}')
})
