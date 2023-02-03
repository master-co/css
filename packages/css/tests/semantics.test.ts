import { testCSS } from '../src/utils/test-css'
import { config } from '../../../master.css.js'
import extend from 'to-extend'

test('semantics', () => {
    testCSS(
        'show',
        '.show{display:block}',
        config
    )
    testCSS(
        'hide-text',
        '.hide-text{font-size:0px}',
        config
    )
    testCSS(
        'zero',
        '.zero{font-size:0px;height:0px}',
        config
    )
    testCSS(
        'zero-h',
        '.zero-h{height:0}',
        config
    )
    testCSS('full', '.full{width:100%;height:100%}')
    testCSS(
        'hide-text',
        '.hide-text{font-size:0px!important}',
        extend(config, { important: true })
    )
})
