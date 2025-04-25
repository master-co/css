import { test } from 'vitest'
import { expectLayers } from '../test'

test.concurrent('components', () => {
    expectLayers(
        {
            components: '.\\?{padding-left:1.25rem;padding-right:1.25rem}.\\?{font-size:0.875rem}.\\?{height:2.5rem}.\\?{text-align:center}.\\?:hover{color:#fff}'
        },
        '?',
        {
            components: {
                '?': 'font:14 text:center h:40 px:20 fg:#fff:hover'
            }
        }
    )
})

test.concurrent('viewports', () => {
    expectLayers(
        {
            general: '@media (width>=31.25rem){.hidden\\@xss{display:none}}'
        },
        'hidden@xss',
        {
            at: {
                'xss': 500
            }
        }
    )
})

test.concurrent('colors', () => {
    expectLayers(
        {
            general: '.fg\\:newColor{color:rgb(99 105 124)}'
        },
        'fg:newColor',
        {
            variables: {
                newColor: {
                    '': '#63697c',
                    10: '#131518',
                    50: '#63697c',
                    90: '#f4f4f6'
                }
            }
        }
    )
})

test.concurrent('at', () => {
    expectLayers(
        {
            general: '@media (width>=37.5rem){.f\\:12\\@min-600{font-size:0.75rem}}'
        },
        'f:12@min-600',
        {
            at: {
                'min-600': '@media(width>=600)'
            }
        }
    )
})

test.concurrent('animations', () => {
    expectLayers(
        {
            general: '.\\@float\\|\\.5s{animation:float 0.5s}',
            animations: '@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}'
        },
        '@float|.5s',
        {
            variables: {
                float: '#000000'
            },
            animations: {
                float: {
                    '0%': { transform: 'none' },
                    '50%': { transform: 'translateY(-1.25rem)' },
                    to: { transform: 'none' }
                },
            }
        }
    )
})