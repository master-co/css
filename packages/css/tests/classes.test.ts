import { testCSS } from './css'
import { config } from '../../../master.css.js'
import { extend } from '@techor/extend'

test('classes', () => {
    testCSS(
        'btn',
        '.text\\:center,.btn,.blue-btn{text-align:center}.h\\:40,.btn,.blue-btn{height:2.5rem}.font\\:14,.btn,.blue-btn{font-size:0.875rem}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:#fbe09d}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:#ffffff}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:#ffffff}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:#ebbb40}',
        config
    )
    testCSS(
        'blue-btn',
        '.bg\\:blue,.blue-btn{background-color:#175fe9}.text\\:center,.btn,.blue-btn{text-align:center}.h\\:40,.btn,.blue-btn{height:2.5rem}.font\\:14,.btn,.blue-btn{font-size:0.875rem}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:#fbe09d}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:#ffffff}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:#ffffff}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:#ebbb40}',
        config
    )
    testCSS(
        'blue-btn',
        '.bg\\:blue,.blue-btn{background-color:#175fe9!important}.text\\:center,.btn,.blue-btn{text-align:center!important}.h\\:40,.btn,.blue-btn{height:2.5rem!important}.font\\:14,.btn,.blue-btn{font-size:0.875rem!important}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem!important}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500!important}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:#fbe09d!important}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:#ffffff!important}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600!important}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:#ffffff!important}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:#ebbb40!important}',
        extend(config, { important: true })
    )
    testCSS(
        'highlight-numbers',
        '.\\{content\\:counter\\(lineNumber\\)\\;inline-block\\;counter-increment\\:lineNumber\\;pr\\:16\\;text\\:right\\;ml\\:-5\\;fg\\:fader\\;w\\:30\\;font\\:80\\%\\}_\\.highlight-line\\:before .highlight-line:before,.highlight-numbers .highlight-line:before{content:counter(lineNumber);display:inline-block;counter-increment:lineNumber;padding-right:1rem;text-align:right;margin-left:-0.3125rem;width:1.875rem;font-size:80%}.light .\\{content\\:counter\\(lineNumber\\)\\;inline-block\\;counter-increment\\:lineNumber\\;pr\\:16\\;text\\:right\\;ml\\:-5\\;fg\\:fader\\;w\\:30\\;font\\:80\\%\\}_\\.highlight-line\\:before .highlight-line:before,.light .highlight-numbers .highlight-line:before{color:#ecedf1}.dark .\\{content\\:counter\\(lineNumber\\)\\;inline-block\\;counter-increment\\:lineNumber\\;pr\\:16\\;text\\:right\\;ml\\:-5\\;fg\\:fader\\;w\\:30\\;font\\:80\\%\\}_\\.highlight-line\\:before .highlight-line:before,.dark .highlight-numbers .highlight-line:before{color:#6b6a6d}',
        {
            colors: {
                fader: {
                    '@light': 'slate-90',
                    '@dark': 'gray-50'
                }
            },
            classes: {
                'highlight-numbers': '{content:counter(lineNumber);inline-block;counter-increment:lineNumber;pr:16;text:right;ml:-5;fg:fader;w:30;font:80%}_.highlight-line:before'
            }
        }
    )
})