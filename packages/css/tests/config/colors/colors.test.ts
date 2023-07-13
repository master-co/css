import { testCSS } from './css'
import config from './config'

test('colors', () => {
    testCSS(
        'fg:primary',
        '.fg\\:primary{color:#175fe9}.dark .fg\\:primary{color:#fbe09d}.light .fg\\:primary{color:#ebbb40}',
        config
    )
    testCSS(
        'fg:primary-code',
        '.fg\\:primary-code{color:#777777}.dark .fg\\:primary-code{color:#6b6a6d}',
        config
    )
    testCSS(
        'fg:primary-stage-1',
        '.fg\\:primary-stage-1{color:#999999}.dark .fg\\:primary-stage-1{color:#AAAAAA}.light .fg\\:primary-stage-1{color:#888888}',
        config
    )
    testCSS(
        'b:input',
        '.b\\:input{border-color:#123456}',
        config
    )
    testCSS(
        'bg:blue-100',
        '.bg\\:blue-100{background-color:#777}',
        {
            colors: {
                'blue-100': '#777'
            }
        }
    )
    testCSS(
        'bg:primary-alpha',
        '.bg\\:primary-alpha{background-color:#175fe91a}',
        config
    )
    testCSS(
        'bg:primary-rgb1',
        '.bg\\:primary-rgb1{background-color:#000000}',
        config
    )
    testCSS(
        'bg:primary-rgb2',
        '.bg\\:primary-rgb2{background-color:#000000}',
        config
    )
    testCSS(
        'bg:primary-rgb3',
        '.bg\\:primary-rgb3{background-color:#00000080}',
        config
    )
    testCSS(
        'bg:primary-rgb4',
        '.bg\\:primary-rgb4{background-color:#00000080}',
        config
    )
    testCSS(
        'bg:primary-rgb5',
        '.bg\\:primary-rgb5{background-color:#000000}',
        config
    )
    testCSS(
        'bg:primary-rgb6',
        '.bg\\:primary-rgb6{background-color:#00000080}',
        config
    )
    testCSS(
        'bg:primary-2',
        '.bg\\:primary-2{background-color:#000000b3}',
        config
    )
    testCSS(
        'bg:linear-gradient(180deg,major,gray-60)',
        '.dark .bg\\:linear-gradient\\(180deg\\,major\\,gray-60\\){background-image:linear-gradient(180deg,#dad9db,#9e9da0)}.light .bg\\:linear-gradient\\(180deg\\,major\\,gray-60\\){background-image:linear-gradient(180deg,#19212d,#9e9da0)}',
        config
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.light .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#000000,#111111)}.dark .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#ffffff,#eeeeee)}',
        {
            colors: {
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                },
                accent: {
                    '@light': '#111111',
                    '@dark': '#eeeeee'
                }
            }
        }
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.dark .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#ffffff,#eeeeee)}',
        {
            colors: {
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                },
                accent: {
                    '@dark': '#eeeeee'
                }
            }
        }
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.light .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#000000,accent)}.dark .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#ffffff,accent)}',
        {
            colors: {
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                }
            }
        }
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.light .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#000000,#ff0000)}.dark .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#ffffff,#ff0000)}',
        {
            colors: {
                accent: '#ff0000',
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                }
            }
        }
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.dark .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#ffffff,#aa0000)}.light .bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,#000000,#ff0000)}',
        {
            colors: {
                accent: {
                    '': '#ff0000',
                    '@dark': '#aa0000'
                },
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                }
            }
        }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block}.light .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#cccccc}.dark .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#333333}',
        {
            colors: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            }
        }
    )
    testCSS(
        'btn',
        '.bg\\:primary-filled,.btn{background-color:#dca000}.light .bg\\:primary-filled,.light .btn{background-color:#ecbb40}.dark .bg\\:primary-filled,.dark .btn{background-color:#dca000}',
        {
            colors: {
                primary: {
                    filled: {
                        '': 'gold-70',
                        '@light': 'gold-75',
                        '@dark': 'gold-70'
                    }
                }
            },
            classes: {
                btn: 'bg:primary-filled'
            }
        }
    )
    testCSS(
        'bg:primary-filled',
        '.bg\\:primary-filled,.btn{background-color:#dca000}.light .bg\\:primary-filled,.light .btn{background-color:#ecbb40}.dark .bg\\:primary-filled,.dark .btn{background-color:#dca000}',
        {
            colors: {
                primary: {
                    filled: {
                        '': 'gold-70',
                        '@light': 'gold-75',
                        '@dark': 'gold-70'
                    }
                }
            },
            classes: {
                btn: 'bg:primary-filled'
            }
        }
    )
    testCSS(
        'bg:primary-filled@dark',
        '.dark .bg\\:primary-filled\\@dark{background-color:#dca000}',
        {
            colors: {
                primary: {
                    filled: {
                        '': 'gold-70',
                        '@light': 'gold-75',
                        '@dark': 'gold-70'
                    }
                }
            },
            classes: {
                btn: 'bg:primary-filled'
            }
        }
    )
})
