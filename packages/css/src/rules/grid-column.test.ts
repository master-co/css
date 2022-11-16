import { testCSS, testProp } from '../utils/test-css'

test('grid-column', () => {
    testCSS('grid-col-span:2', '.grid-col-span\\:2{grid-column:span 2/span 2}')
    testCSS('grid-column-span:2', '.grid-column-span\\:2{grid-column:span 2/span 2}')
})
