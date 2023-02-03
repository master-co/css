import { testCSS } from '../src/utils/test-css'
import MasterCSS from '../src'
import { config } from '../../../master.css.js'

test('mediaQueries', () => {
    testCSS(
        'hide@watch',
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}',
        config
    )
    testCSS(
        'hide@device-watch',
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@device-watch{display:none}}',
        config
    )
})
