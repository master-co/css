import { testCSS } from '../src/utils/test-css'
import { config } from '../../../master.css.js'

test('colors', () => {
    testCSS(
        'fg:primary',
        '.fg\\:primary,.dark .btn,.blue-btn{color:#175fe9}.light .fg\\:primary,.light .blue-btn{color:#ebbb40}.dark .fg\\:primary,.dark .btn,.dark .blue-btn{color:#fbe09d}',
        config
    )
    testCSS(
        'fg:primary-code',
        '.fg\\:primary-code{color:#777777}.dark .fg\\:primary-code{color:#6b6a6d}',
        config
    )
    testCSS(
        'fg:primary-stage-1',
        '.fg\\:primary-stage-1{color:#999999}.light .fg\\:primary-stage-1{color:#888888}.dark .fg\\:primary-stage-1{color:#AAAAAA}',
        config
    ),
    testCSS(
        'b:input',
        '.b\\:input{border-color:#123456}',
        config
    ),
    testCSS(
        'bg:blue-100',
        '.bg\\:blue-100{background-color:#777}',
        {
            colors: {
                'blue-100': '#777'
            }
        }
    ),
    testCSS(
        'bg:primary-alpha',
        '.bg\\:primary-alpha{background-color:#175fe91a}',
        config
    ),
    testCSS(
        'bg:primary-rgb1',
        '.bg\\:primary-rgb1{background-color:#000000}',
        config
    ),
    testCSS(
        'bg:primary-rgb2',
        '.bg\\:primary-rgb2{background-color:#000000}',
        config
    ),
    testCSS(
        'bg:primary-rgb3',
        '.bg\\:primary-rgb3{background-color:#00000080}',
        config
    ),
    testCSS(
        'bg:primary-rgb4',
        '.bg\\:primary-rgb4{background-color:#00000080}',
        config
    ),
    testCSS(
        'bg:primary-2',
        '.bg\\:primary-2{background-color:#000000b3}',
        config
    )
})
