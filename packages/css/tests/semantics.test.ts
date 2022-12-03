import { testCSS } from '../src/utils/test-css'
import MasterCSS from '../src'
import config from '../../../master.css.js'

test('semantics', () => {
    testCSS(
        'show',
        '.show{display:block}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide-text',
        '.hide-text{font-size:0px}',
        new MasterCSS({ config })
    )
    testCSS(
        'zero',
        '.zero{font-size:0px;height:0px}',
        new MasterCSS({ config })
    )
    testCSS(
        'zero-h',
        '.zero-h{height:0}',
        new MasterCSS({ config })
    )
    testCSS('full', '.full{width:100%;height:100%}')
})
