/** @type {import('@master/css').Config} */
export default {
    colors: {
        primary: {
            '': 'gold-75@light gold-80@dark',
            filled: 'gold-75@light gold-70@dark'
        },
        major: 'slate-10@light gray-80@dark',
        neutural: 'slate-30@light gray-60@dark',
        panel: 'white@light gray-25@dark',
        divider: 'slate-60/.2@light white/.1@dark',
        ring: 'slate-60/.1@light white/.1@dark',
        shadow: 'slate-70@light black@dark'
    },
    styles: {
        btn: `
            inline-flex center-content px:25 h:48 r:5
            bg:primary-filled
            fg:white font:14 font:semibold text:center
        `
    },
    variables: {
        boxShadow: {
            x3: '0|2|4|shadow/.12,0|4|8|shadow/.08,0|20|30|shadow/.1'
        }
    }
}