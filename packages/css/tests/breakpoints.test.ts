import { testCSS } from '../src/utils/test-css'
import MasterCSS from '..'
import config from '../../../master.css.js'

test('breakpoints', () => {
    testCSS(
        'hide@tablet',
        '@media (min-width:768px){.hide\\@tablet{display:none}}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide@laptop',
        '@media (min-width:1024px){.hide\\@laptop{display:none}}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide@desktop',
        '@media (min-width:1280px){.hide\\@desktop{display:none}}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide@custom-1',
        '@media (min-width:2500px){.hide\\@custom-1{display:none}}',
        new MasterCSS({ config })
    )
})
