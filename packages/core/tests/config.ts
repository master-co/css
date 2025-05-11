export default {
    components: {
        btn: 'font:14 h:40 text:center bg:primary@light fg:white@light font:medium@light bg:white@dark fg:primary@dark font:medium@dark',
        blue: {
            btn: {
                '': 'btn f:20@light'
            }
        }
    },
    modeTrigger: 'class',
    modes: {
        light: {
            primary: '$(black)',
            'primary-text': '$(white)',
            'primary-active': '$(gray)',
            'primary-stage-1': '$(black)',
            accent: '$(black)',
            major: '$(black)',
            content: '$(black)',
            fade: '$(black)',
            'fade-light': '$fade',
        },
        dark: {
            primary: '$(white)',
            'primary-text': '$(black)',
            'primary-active': '$(white)',
            'primary-code': '$(white)',
            'primary-stage-1': '$(white)',
            accent: '$(white)',
            major: '$(white)',
            content: '$(white)',
            fade: '$(white)',
        },
    },
    variables: {
        'font-size': {
            sm: 16,
            md: 20
        },
        'letter-spacing': {
            wide: .4
        },
        border: {
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
            code: '$(black)',
            stage: {
                1: '$(white)'
            },
            alpha: '$(white)/.1',
            rgb1: 'rgb(0, 0, 0)',
            rgb2: 'oklch(0% 0 none)',
            rgb3: 'rgb(0 0 0/.5)',
            '2': '$primary-rgb3/.7'
        },
        input: '#123456',
        code: '$(accent)',
    },
    utilities: {
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
        'custom': 'div>:first+button',
        'custom-1': 'div'
    },
    at: {
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
        'custom-1': 2500,
        watch: 'media(width<=42mm)and(width>=38mm)',
        'device-watch': 'media(width<=42mm)and(width>=38mm)',
    },
    rootSize: 16,
} as any
