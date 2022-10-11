const { configure } = require('../src/configure');

module.exports = configure({
    classes: {
        btn: 'font:14 h:40 text:center bg:red',
        card: 'p:20 b:1|solid|gray-80 bg:white'
    },
    values: {
        Width: {
            '2x': '2rem',
            '3x': '3rem',
        }
    },
    semantics: {
        show: 'display:block',
        'hide-text': 'font-size:0px'
    },
    breakpoints: {
        tablet: '768px',
        laptop: '1024px',
        desktop: '1280px',
    },
    selectors: {
        '>custom': '>div>:first+button'
    },
    mediaQueries: {
        watch: '(max-device-width:42mm) and (min-device-width:38mm)'
    },
    colors: {
        primary: '#175fe9',
    },
    themes: {
        dark: {
            colors: {
                primary: '#6b9ef1',
            },
            classes: {
                btn: 'font:14 h:40 text:center bg:white',
            }
        }
    },
    Rules: [],
    rootSize: 16,
    // sources: {
    //     files: ['./src/**/*.{html,js}'],
    //     // 輸出成單一 CSS 檔案
    //     output: './dist/master.css',
    //     // 注入目標 HTML 檔案
    //     output: './dist/index.html',
    //     // 自訂輸出規則
    //     output: ({ raw }) => {

    //     }
    // }
})
