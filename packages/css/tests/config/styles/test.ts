import MasterCSS from '../../../src'
import config from '../../config'
import extend from '@techor/extend'

test('styles', () => {
    expect(new MasterCSS(config).add('btn').text)
        .toBe('.font\\:14,.btn,.blue-btn{font-size:0.875rem}.h\\:40,.btn,.blue-btn{height:2.5rem}.text\\:center,.btn,.blue-btn{text-align:center}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(0 0 0)}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(255 255 255)}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}')

    expect(new MasterCSS(config).add('blue-btn').text)
        .toBe('.font\\:14,.btn,.blue-btn{font-size:0.875rem}.h\\:40,.btn,.blue-btn{height:2.5rem}.text\\:center,.btn,.blue-btn{text-align:center}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(0 0 0)}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(255 255 255)}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600}')

    expect(new MasterCSS(extend(config, { important: true })).add('blue-btn').text)
        .toBe('.font\\:14,.btn,.blue-btn{font-size:0.875rem!important}.h\\:40,.btn,.blue-btn{height:2.5rem!important}.text\\:center,.btn,.blue-btn{text-align:center!important}.dark .bg\\:white\\@dark,.dark .btn,.dark .blue-btn{background-color:rgb(255 255 255)!important}.light .bg\\:primary\\@light,.light .btn,.light .blue-btn{background-color:rgb(0 0 0)!important}.dark .fg\\:primary\\@dark,.dark .btn,.dark .blue-btn{color:rgb(255 255 255)!important}.light .fg\\:white\\@light,.light .btn,.light .blue-btn{color:rgb(255 255 255)!important}.light .f\\:20\\@light,.light .blue-btn{font-size:1.25rem!important}.dark .font\\:medium\\@dark,.dark .btn,.dark .blue-btn{font-weight:500!important}.light .font\\:semibold\\@light,.light .btn,.light .blue-btn{font-weight:600!important}')

    expect(new MasterCSS({
        variables: {
            custom: {
                '@light': '$(black)',
                '@dark': '$(white)'
            }
        },
        styles: {
            'highlight-numbers': '{content:counter(lineNumber);inline-block;counter-increment:lineNumber;pr:16;text:right;ml:-5;fg:custom;w:30;font:80%}_.highlight-line:before'
        }
    }).add('highlight-numbers').text)
        .toBe('.light{--custom:0 0 0}.dark{--custom:255 255 255}.\\{content\\:counter\\(lineNumber\\)\\;inline-block\\;counter-increment\\:lineNumber\\;pr\\:16\\;text\\:right\\;ml\\:-5\\;fg\\:custom\\;w\\:30\\;font\\:80\\%\\}_\\.highlight-line\\:before .highlight-line:before,.highlight-numbers .highlight-line:before{content:counter(lineNumber);display:inline-block;counter-increment:lineNumber;padding-right:1rem;text-align:right;margin-left:-0.3125rem;color:rgb(var(--custom));width:1.875rem;font-size:80%}')
})