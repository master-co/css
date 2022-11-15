import { testCSS } from '../utils/test-css'
import MasterCSS from '..'
import config from '../../../../master.css.js'

test('values', () => {
    testCSS(
        'w:2x',
        '.w\\:2x{width:2rem}',
        new MasterCSS({ config })
    )
    testCSS(
        'w:3x',
        '.w\\:3x{width:3rem}',
        new MasterCSS({ config })
    )
    testCSS(
        'w:x-1-2',
        '.w\\:x-1-2{width:50rem}',
        new MasterCSS({ config })
    )
    testCSS(
        'w:x-2',
        '.w\\:x-2{width:100rem}',
        new MasterCSS({ config })
    )
    // testCSS(
    //     'font:sm',
    //     '.font\\:sm{font-size:1rem}',
    //     new MasterCSS({ config })
    // )
    // testCSS(
    //     'font-size:sm',
    //     '.font-size\\:sm{font-size:1rem}',
    //     new MasterCSS({ config })
    // )
    // testCSS(
    //     'ls:wide',
    //     '.ls\\:wide{letter-spacing:0.025em}',
    //     new MasterCSS({ config })
    // )
    // testCSS(
    //     'letter-spacing:wide',
    //     '.letter-spacing\\:wide{letter-spacing:0.025em}',
    //     new MasterCSS({ config })
    // )
})
