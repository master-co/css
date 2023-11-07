/** @type {import('@master/css').Config} */
export default {
    styles: {
        btn: `
            inline-flex center-content px:25 h:48 r:5
            bg:primary-filled
            fg:white font:14 font:semibold text:center
        `
    },
    variables: {
        primary: {
            '': { '@light': '$(gold-75)', '@dark': '$(gold-80)' },
            filled: { '@light': '$(gold-75)', '@dark': '$(gold-70)' }
        },
        major: { '@light': '$(slate-10)', '@dark': '$(gray-80)' },
        neutural: { '@light': '$(slate-30)', '@dark': '$(gray-60)' },
        panel: { '@light': '$(white)', '@dark': '$(gray-25)' },
        divider: { '@light': '$(slate-60)/.2', '@dark': '$(white)/.1' },
        ring: { '@light': '$(slate-60)/.1', '@dark': '$(white)/.1' },
        shadow: { '@light': '$(slate-70)', '@dark': '$(black)' },
        box: {
            shadow: {
                x3: '0|2|4|shadow/.12,0|4|8|shadow/.08,0|20|30|shadow/.1'
            }
        }
    }
}