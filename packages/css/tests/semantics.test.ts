import { testCSS } from './css'
import { config } from '../../../master.css.js'

test('semantics fuck', () => {
    testCSS(
        'show',
        '.show{display:block}',
        config
    )
    testCSS(
        'gradient-text',
        '.gradient-text{-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text}'
    )
    // testCSS(
    //     'hide-text',
    //     '.hide-text{font-size:0px}',
    //     config
    // )
    // testCSS(
    //     'zero',
    //     '.zero{font-size:0px;height:0px}',
    //     config
    // )
    // testCSS(
    //     'zero-h',
    //     '.zero-h{height:0}',
    //     config
    // )
    // testCSS('full', '.full{width:100%;height:100%}')
    // testCSS(
    //     'hide-text',
    //     '.hide-text{font-size:0px!important}',
    //     extend(config, { important: true })
    // )
})
