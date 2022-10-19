import { testCSS } from './utils/test-css'
import MasterCSS, { configure } from '../src'

test('classes', () => {
    testCSS(
        '?',
        '.px\\:20,.\\?{padding-left:1.25rem;padding-right:1.25rem}.h\\:40,.\\?{height:2.5rem}.text\\:center,.\\?{text-align:center}.font\\:14,.\\?{font-size:0.875rem}.fg\\:\\#fff\\:hover:hover,.\\?:hover{color:#fff}',
        new MasterCSS(configure({
            'classes': {
                '?': 'font:14 text:center h:40 px:20 fg:#fff:hover'
            }
        }))
    )
})

test('breakpoints', () => {
    testCSS(
        'hide@xss',
        '@media (min-width:500px){.hide\\@xss{display:none}}',
        new MasterCSS(configure({
            'breakpoints': {
                'xss': 500
            }
        }))
    )
})

test('colors', () => {
    testCSS(
        'fg:newColor',
        '.fg\\:newColor{color:#63697c}',
        new MasterCSS(configure({
            'colors': {
                newColor: {
                    '': '#63697c',
                    10: '#131518',
                    50: '#63697c',
                    90: '#f4f4f6'
                }
            }
        }))
    )
})

test('mediaQueries', () => {
    testCSS(
        'f:12@min-600',
        '@media (min-width: 600px){.f\\:12\\@min-600{font-size:0.75rem}}',
        new MasterCSS(configure({
            'mediaQueries': {
                'min-600': '(min-width: 600px)'
            }
        }))
    )
})
