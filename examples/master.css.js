const { defaultColors } = require('../src')

module.exports = {
    colors: {
        primary: {
            '': 'blue-50',
            code: '#777777',
            stage: {
                '1': '#999999'
            }
        },
    },
    classes: {
        btn: 'font:14 h:40 text:center',
        'blue-btn': 'btn bg:blue'
    },
    themes: {
        light: {
            colors: {
                primary: {
                    '': '#ebbb40',
                    stage: {
                        '1': '#888888'
                    }
                },
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
                primary: {
                    '': '#fbe09d',
                    code: 'gray',
                    stage: {
                        '1': '#AAAAAA'
                    }
                },
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
        '2x': '32',
        '3x': '3rem',
        Width: {
            x: {
                '1': {
                    '1': '25rem',
                    '2': '50rem',
                    '3': '75rem'
                },
                '2': '100rem'
            }
        }
    },
    semantics: {
        show: 'display:block',
        'hide-text': 'font-size:0px',
        zero: {
            h: {
                'height': 0
            },
            'font-size': '0px',
            height: '0px'
        }
    },
    breakpoints: {
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
        custom: {
            '1': 2500
        }
    },
    selectors: {
        '>custom': '>div>:first+button',
        '_custom': '::before,::after',
        '~custom': {
            '1': '~div'
        }
    },
    mediaQueries: {
        watch: '(max-device-width:42mm) and (min-device-width:38mm)'
    },
    rootSize: 16,
    Rules: []
}
