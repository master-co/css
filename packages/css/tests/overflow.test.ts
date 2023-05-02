import { testCSS, testProp } from './css'

test('overflow', () => {
    testProp('overflowed', 'overflow:visible')
    testProp('overflow:hidden', 'overflow:hidden')
    testProp('overflow:$(overflow)', 'overflow:var(--overflow)')
    testProp('overflow:overlay', 'overflow:auto;overflow:overlay')
    testProp('overflow-x:overlay', 'overflow-x:auto;overflow-x:overlay')
    testProp('overflow-y:overlay', 'overflow-y:auto;overflow-y:overlay')
    testCSS('overflowed:hover', '.overflowed\\:hover:hover{overflow:visible}')
})
