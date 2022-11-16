import { testCSS } from '../utils/test-css'
import MasterCSS from '..'

import config from '../../../../master.css.js'

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