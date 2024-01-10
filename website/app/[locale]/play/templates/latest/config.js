/** @type {import('@master/css').Config} */
export default {
    styles: {
        btn: 'inline-flex center-content px:6x h:48 r:1x bg:primary fg:primary-invert font:14 font:semibold text:center'
    },
    variables: {
        text: {
            primary: {
                invert: {
                    '@light': '$(yellow-90)',
                    '@dark': '$(yellow-95)'
                }
            }
        },
        accent: {
            '@light': '$(yellow-50)',
            '@dark': '$(amber-20)'
        },
        primary: {
            '@light': '$(yellow-40)',
            '@dark': '$(yellow-50)'
        },
        panel: {
            '@light': '$(white)',
            '@dark': '$(gray-80)'
        },
        divider: {
            '@light': '$(slate-90)/.1',
            '@dark': '$(white)/.1'
        },
        ring: {
            '@light': '$(slate-40)/.1',
            '@dark': '$(white)/.1'
        },
        'box-shadow': {
            '01': '0|2|4|black/.12,0|4|8|black/.08,0|20|30|black/.1'
        }
    }
}