import { testCSS } from '../src/utils/test-css'
import MasterCSS from '../src'
import config from '../../../master.css.js'

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
    )
})
