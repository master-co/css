/** @type {import('@master/css').Config} */
export default {
    colors: {
        primary: {
            '': '#175fe9',
            code: '#777777'
        },
    },
    classes: {
        btn: 'font:14 h:40 text:center',
        'blue-btn': 'btn bg:blue'
    },
    themes: {
        light: {
            colors: {
                primary: '#ebbb40',
                accent: 'gold-70',
                major: 'slate-10',
                content: 'slate-30',
                fade: 'slate-55'
            },
            classes: {
                btn: 'bg:primary fg:white font:semibold'
            }
        },
        dark: {
            colors: {
                primary: '#fbe09d',
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
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
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
}
