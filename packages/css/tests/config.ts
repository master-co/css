export default {
    styles: {
        btn: 'font:14 h:40 text:center bg:primary@light fg:white@light font:semibold@light bg:white@dark fg:primary@dark font:medium@dark',
        blue: {
            btn: {
                '': 'btn f:20@light'
            }
        }
    },
    variables: {
        'font-size': {
            sm: 16,
            md: 20
        },
        'letter-spacing': {
            wide: .4
        },
        border:  {
            'inputborder': '2|solid|black'
        },
        'box-shadow': {
            x2: '0 25px 50px -12px rgb(0 0 0 / 25%)'
        },
        inset: {
            sm: 10,
            md: 20
        },
        primary: {
            '': '$(black)',
            '@light': '$(black)',
            '@dark': '$(white)',
            code: {
                '': '$(black)',
                '@dark': '$(white)'
            },
            stage: {
                '1': {
                    '': '$(white)',
                    '@light': '$(black)',
                    '@dark': '$(white)'
                }
            },
            alpha: '$(white)/.1',
            rgb1: 'rgb(0, 0, 0)',
            rgb2: 'rgb(0 0 0)',
            rgb3: 'rgb(0 0 0/.5)',
            rgb4: 'rgb(0,0,0,.5)',
            '2': '$(primary-rgb4)/.7'
        },
        input: '#123456',
        accent: {
            '@light': '$(black)',
            '@dark': '$(white)'
        },
        major: {
            '@light': '$(black)',
            '@dark': '$(white)'
        },
        content: {
            '@light': '$(black)',
            '@dark': '$(white)'
        },
        fade: {
            '@light': '$(black)',
            '@dark': '$(white)'
        },
        code: '$(accent)',
        'fade-light': {
            '@light': '$(fade@light)'
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
    rootSize: 16,
} as any
