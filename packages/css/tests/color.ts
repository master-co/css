import { testCSS, testProp } from './utils/test-css'

test('color', () => {
    testCSS('color:current:hover', '.color\\:current\\:hover:hover{color:currentColor}')
    testProp('color:current', 'color:currentColor')
    testProp('color:rgb(255,255,255)', 'color:rgb(255,255,255)')
    testProp('fg:#fff', 'color:#fff')
    testProp('fg:current', 'color:currentColor')
    testProp('foreground:current', 'color:currentColor')
    testProp('fg:transparent', 'color:transparent')
    testProp('foreground:transparent', 'color:transparent')
})
