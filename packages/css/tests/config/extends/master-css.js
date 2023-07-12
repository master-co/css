const config = {
    extends: [
        require('./master-1.css'),
        require('./master-2.css')
    ],
    themes: {
        light: {
            colors: {
                primary: {
                    '': '#ebbb40',
                    stage: {
                        '1': '#888888'
                    }
                },
                accent: 'gold-70',
                major: 'slate-10',
                content: 'slate-30',
                fade: 'slate-55'
            },
            classes: {
                btn: 'bg:primary fg:white font:semibold',
                blue: {
                    btn: 'f:20'
                }
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
                major: 'gray-80',
                content: 'gray-60',
                fade: 'gray-60'
            },
            classes: {
                btn: 'bg:white fg:primary font:medium'
            }
        }
    },
    rules: {
        width: {
            values: {
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
        fontSize: {
            values: {
                sm: 16,
                md: 20
            }
        },
        letterSpacing: {
            values: {
                wide: .4
            }
        },
        border: {
            values: {
                'inputborder': '2|solid|red'
            }
        },
        boxShadow: {
            values: {
                '2x': '0 25px 50px -12px rgb(0 0 0 / 25%)'
            }
        },
        inset: {
            values: {
                sm: 10,
                md: 20
            }
        }
    },
    values: {
        '2': {
            x: '32'
        },
        '3x': '3rem'
    },
    semantics: {
        show: {
            display: 'block'
        },
        'hide-text': {
            'font-size': '0px'
        },
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
        watch: '(max-device-width:42mm) and (min-device-width:38mm)',
        device: {
            watch: '(max-device-width:42mm) and (min-device-width:38mm)'
        }
    },
    rootSize: 16
}

module.exports = {
    config
}
