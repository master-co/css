import { testCSS } from './utils/test-css'
import MasterCSS from '../src'

import config from '../examples/master.css.js'

test('classes', () => {
    testCSS(
        'btn',
        '.font\\:medium,.dark .btn,.blue-btn{font-weight:500}.fg\\:primary,.dark .btn,.blue-btn{color:#175fe9}.light .fg\\:primary,.light .blue-btn{color:#ebbb40}.dark .fg\\:primary,.dark .btn,.dark .blue-btn{color:#fbe09d}.bg\\:white,.dark .btn,.blue-btn{background-color:#ffffff}.font\\:semibold,.light .btn,.blue-btn{font-weight:600}.fg\\:white,.light .btn,.blue-btn{color:#ffffff}.bg\\:primary,.light .btn,.blue-btn{background-color:#175fe9}.light .bg\\:primary,.light .btn,.light .blue-btn{background-color:#ebbb40}.dark .bg\\:primary,.dark .blue-btn{background-color:#fbe09d}.text\\:center,.btn,.blue-btn{text-align:center}.h\\:40,.btn,.blue-btn{height:2.5rem}.font\\:14,.btn,.blue-btn{font-size:0.875rem}',
        new MasterCSS({ config })
    )
    testCSS(
        'blue-btn',
        '.bg\\:blue,.blue-btn{background-color:#175fe9}.font\\:medium,.dark .btn,.blue-btn{font-weight:500}.fg\\:primary,.dark .btn,.blue-btn{color:#175fe9}.light .fg\\:primary,.light .blue-btn{color:#ebbb40}.dark .fg\\:primary,.dark .btn,.dark .blue-btn{color:#fbe09d}.bg\\:white,.dark .btn,.blue-btn{background-color:#ffffff}.font\\:semibold,.light .btn,.blue-btn{font-weight:600}.fg\\:white,.light .btn,.blue-btn{color:#ffffff}.bg\\:primary,.light .btn,.blue-btn{background-color:#175fe9}.light .bg\\:primary,.light .btn,.light .blue-btn{background-color:#ebbb40}.dark .bg\\:primary,.dark .blue-btn{background-color:#fbe09d}.text\\:center,.btn,.blue-btn{text-align:center}.h\\:40,.btn,.blue-btn{height:2.5rem}.font\\:14,.btn,.blue-btn{font-size:0.875rem}',
        new MasterCSS({ config })
    )
})

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
})

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
})

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
})

test('selectors', () => {
    testCSS(
        'hide>custom', 
        '.hide\\>custom>div>:first-child+button{display:none}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide_custom',
        '.hide_custom::before,.hide_custom::after{display:none}',
        new MasterCSS({ config })
    )
    testCSS(
        'hide::slider-thumb', 
        '.hide\\:\\:slider-thumb::-webkit-slider-thumb{display:none}.hide\\:\\:slider-thumb::-moz-range-thumb{display:none}',
        new MasterCSS({ config })
    )
})

test('mediaQueries', () => {
    testCSS(
        'hide@watch', 
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}',
        new MasterCSS({ config })
    )
})

test('colors', () => {
    testCSS(
        'fg:primary', 
        '.fg\\:primary,.dark .btn,.blue-btn{color:#175fe9}.light .fg\\:primary,.light .blue-btn{color:#ebbb40}.dark .fg\\:primary,.dark .btn,.dark .blue-btn{color:#fbe09d}',
        new MasterCSS({ config })
    )
    testCSS(
        'fg:primary-code', 
        '.fg\\:primary-code{color:#777777}',
        new MasterCSS({ config })
    )
})
