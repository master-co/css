import { testCSS } from '../src/utils/test-css'

test('font-family', () => {
    testCSS('font:serif', '.font\\:serif{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif}')
})