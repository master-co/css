/** @type {import('@master/css').Config} */
export default {
    styles: {
        btn: 'inline-flex center-content px:25 h:48 r:5 bg:primary fg:white font:14 font:semibold text:center'
    },
    variables: {
        text: {
            primary: {
                '@light': '$(gold-75)',
                '@dark': '$(gold-80)'
            },
            strong: {
                '@light': '$(slate-10)',
                '@dark': '$(gray-80)'
            },
            neutural: {
                '@light': '$(slate-30)',
                '@dark': '$(gray-60)'
            }
        },
        primary: {
            '@light': '$(gold-75)',
            '@dark': '$(gold-70)'
        },
        panel: {
            '@light': '$(white)',
            '@dark': '$(gray-95)'
        },
        frame: {
            '@light': '$(slate-60)/.2',
            '@dark': '$(white)/.1'
        },
        ring: {
            '@light': '$(slate-60)/.1',
            '@dark': '$(white)/.15'
        },
        'box-shadow': {
            '01': '0|2|4|black/.12,0|4|8|black/.08,0|20|30|black/.1'
        }
    }
}