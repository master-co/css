import { testCSS } from '../../src/utils/test-css'
import config from '../../../../master.css.js'

test('scopePrefix', () => {
    testCSS(
        'pt:2ex',
        '.master-css .pt\\:2ex{padding-top:2ex}',
        { ...config, scopePrefix: ".master-css" }
    )

    testCSS(
        'pt:2ex@dark',
        '.dark .master-css .pt\\:2ex\\@dark{padding-top:2ex}',
        { ...config, scopePrefix: ".master-css" }
    )
})
