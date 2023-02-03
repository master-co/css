import { testCSS } from '../../src/utils/test-css'
import { config } from '../../../../master.css.js'

describe('@tve', () => {
    it('scope', () => {
        testCSS(
            'pt:2ex',
            '.master-css .pt\\:2ex{padding-top:2ex}',
            { ...config, scope: '.master-css' }
        )

        testCSS(
            'pt:2ex@dark',
            '.dark .master-css .pt\\:2ex\\@dark{padding-top:2ex}',
            { ...config, scope: '.master-css' }
        )
    })
})
