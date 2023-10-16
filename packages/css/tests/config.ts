export default {
    colors: {
        primary: {
            '': 'blue-50',
            '@light': '#ebbb40',
            '@dark': '#fbe09d',
            code: {
                '': '#777777',
                '@dark': 'gray'
            },
            stage: {
                '1': {
                    '': '#999999',
                    '@light': '#888888',
                    '@dark': '#AAAAAA'
                }
            },
            alpha: 'blue-50/.1',
            rgb1: 'rgb(0, 0, 0)',
            rgb2: 'rgb(0 0 0)',
            rgb3: 'rgb(0 0 0/.5)',
            rgb4: 'rgba(0,0,0,.5)',
            rgb5: 'rgba(0|0|0)',
            rgb6: 'rgba(0|0|0/.5)',
            '2': 'primary-rgb4/.7'
        },
        input: {
            '': '#123456'
        },
        accent: {
            '@light': 'gold-70',
            '@dark': '#fbe09d'
        },
        major: {
            '@light': 'slate-10',
            '@dark': 'gray-80'
        },
        content: {
            '@light': 'slate-30',
            '@dark': 'gray-60'
        },
        fade: {
            '@light': 'slate-55',
            '@dark': 'gray-60'
        },
        code: 'accent',
        'fade-light': {
            '@light': 'fade@light'
        }
    },
    styles: {
        btn: 'font:14 h:40 text:center bg:primary@light fg:white@light font:semibold@light bg:white@dark fg:primary@dark font:medium@dark',
        blue: {
            btn: {
                '': 'btn bg:blue f:20@light'
            }
        }
    },
    rules: {
        fontSize: {
            variables: {
                sm: 16,
                md: 20
            }
        },
        letterSpacing: {
            variables: {
                wide: .4
            }
        },
        border: {
            variables: {
                'inputborder': '2|solid|red'
            }
        },
        boxShadow: {
            variables: {
                '2x': '0 25px 50px -12px rgb(0 0 0 / 25%)'
            }
        },
        inset: {
            variables: {
                sm: 10,
                md: 20
            }
        }
    },
    semantics: {
        show: {
            display: 'block'
        },
        'hide-text': {
            'font-size': '0px'
        },
        zero: {
            'font-size': '0px',
            height: '0px'
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
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
        custom: {
            '1': 2500
        },
        watch: '(max-device-width:42mm) and (min-device-width:38mm)',
        device: {
            watch: '(max-device-width:42mm) and (min-device-width:38mm)'
        }
    },
    rootSize: 16
} as any
