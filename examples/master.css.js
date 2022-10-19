const { defaultColors, configure } = require('../src')

module.exports = configure({
    colors: {
        primary: '#175fe9',
    },
    classes: {
        btn: 'font:14 h:40 text:center',
        'blue-btn': 'btn bg:blue'
    },
    themes: {
        light: {
            colors: {
                primary: '#ebbb40',
                accent: defaultColors.gold['70'],
                major: defaultColors.slate['10'],
                content: defaultColors.slate['30'],
                fade: defaultColors.slate['55']
            },
            classes: {
                btn: 'bg:primary fg:white font:semibold'
            }
        },
        dark: {
            colors: {
                primary: '#fbe09d',
                accent: '#fbe09d',
                major: defaultColors.gray['80'],
                content: defaultColors.gray['60'],
                fade: defaultColors.gray['60']
            },
            classes: {
                btn: 'bg:white fg:primary font:medium'
            }
        }
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
        '>custom': '>div>:first+button',
        '_custom': '::before,::after'
    },
    mediaQueries: {
        watch: '(max-device-width:42mm) and (min-device-width:38mm)'
    },
    rootSize: 16,
    Rules: []
})
