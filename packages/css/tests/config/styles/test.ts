import { testCSS } from '../../css'
import config from '../../config'
import { extend } from '@techor/extend'

test('styles', () => {
    testCSS(
        'btn',
        '.font\\:14,.btn,.blue-btn{font-size:0.875rem}.h\\:40,.btn,.blue-btn{height:2.5rem}.text\\:center,.btn,.blue-btn{text-align:center}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(235 187 64)}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(251 224 157)}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}',
        config
    )
    testCSS(
        'blue-btn',
        '.bg\\:blue,.blue-btn{background-color:rgb(23 95 233)}.font\\:14,.btn,.blue-btn{font-size:0.875rem}.h\\:40,.btn,.blue-btn{height:2.5rem}.text\\:center,.btn,.blue-btn{text-align:center}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(235 187 64)}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(251 224 157)}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}',
        config
    )
    testCSS(
        'blue-btn',
        '.bg\\:blue,.blue-btn{background-color:rgb(23 95 233)!important}.font\\:14,.btn,.blue-btn{font-size:0.875rem!important}.h\\:40,.btn,.blue-btn{height:2.5rem!important}.text\\:center,.btn,.blue-btn{text-align:center!important}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)!important}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(235 187 64)!important}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(251 224 157)!important}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)!important}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem!important}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500!important}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600!important}',
        extend(config, { important: true })
    )
    testCSS(
        'highlight-numbers',
        '.light{--fader:236 237 241}.dark{--fader:107 106 109}.\\{content\\:counter\\(lineNumber\\)\\;inline-block\\;counter-increment\\:lineNumber\\;pr\\:16\\;text\\:right\\;ml\\:-5\\;fg\\:fader\\;w\\:30\\;font\\:80\\%\\}_\\.highlight-line\\:before .highlight-line:before,.highlight-numbers .highlight-line:before{content:counter(lineNumber);display:inline-block;counter-increment:lineNumber;padding-right:1rem;text-align:right;margin-left:-0.3125rem;color:rgb(var(--fader));width:1.875rem;font-size:80%}',
        {
            variables: {
                fader: {
                    '@light': '$(slate-90)',
                    '@dark': '$(gray-50)'
                }
            },
            styles: {
                'highlight-numbers': '{content:counter(lineNumber);inline-block;counter-increment:lineNumber;pr:16;text:right;ml:-5;fg:fader;w:30;font:80%}_.highlight-line:before'
            }
        }
    )
})