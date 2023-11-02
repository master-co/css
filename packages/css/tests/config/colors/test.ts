import { testCSS } from '../../css'
import config from '../../config'

test('colors', () => {
    testCSS(
        'fg:primary',
        '.light{--primary:235 187 64}.dark{--primary:251 224 157}:root{--primary:23 95 233}.fg\\:primary{color:rgb(var(--primary))}',
        config
    )
    testCSS(
        'fg:primary-code',
        ':root{--primary-code:119 119 119}.dark{--primary-code:107 106 109}.fg\\:primary-code{color:rgb(var(--primary-code))}',
        config
    )
    testCSS(
        'fg:primary-stage-1',
        ':root{--primary-stage-1:153 153 153}.light{--primary-stage-1:136 136 136}.dark{--primary-stage-1:170 170 170}.fg\\:primary-stage-1{color:rgb(var(--primary-stage-1))}',
        config
    )
    testCSS(
        'b:input',
        '.b\\:input{border-color:rgb(18 52 86)}',
        config
    )
    testCSS(
        'bg:blue-100',
        '.bg\\:blue-100{background-color:rgb(119 119 119)}',
        {
            variables: {
                'blue-100': '#777'
            }
        }
    )
    testCSS(
        'bg:primary-alpha',
        '.bg\\:primary-alpha{background-color:rgb(23 95 233 / .1)}',
        config
    )
    testCSS(
        'bg:primary-rgb1',
        '.bg\\:primary-rgb1{background-color:rgb(0 0 0)}',
        config
    )
    testCSS(
        'bg:primary-rgb2',
        '.bg\\:primary-rgb2{background-color:rgb(0 0 0)}',
        config
    )
    testCSS(
        'bg:primary-rgb3',
        '.bg\\:primary-rgb3{background-color:rgb(0 0 0 / .5)}',
        config
    )
    testCSS(
        'bg:primary-rgb4',
        '.bg\\:primary-rgb4{background-color:rgb(0 0 0 / .5)}',
        config
    )
    testCSS(
        'bg:primary-2',
        '.bg\\:primary-2{background-color:rgb(0 0 0 / .35)}',
        config
    )
    testCSS(
        'bg:linear-gradient(180deg,major,gray-60)',
        '.light{--major:25 33 45}.dark{--major:218 217 219}.bg\\:linear-gradient\\(180deg\\,major\\,gray-60\\){background-image:linear-gradient(180deg,rgb(var(--major)),rgb(158 157 160))}',
        config
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.light{--primary:0 0 0}.dark{--primary:255 255 255}.light{--accent:17 17 17}.dark{--accent:238 238 238}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}',
        {
            variables: {
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
        '.light{--primary:0 0 0}.dark{--primary:255 255 255}.dark{--accent:238 238 238}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}',
        {
            variables: {
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
        '.light{--primary:0 0 0}.dark{--primary:255 255 255}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),accent)}',
        {
            variables: {
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                }
            }
        }
    )
    testCSS(
        'bg:linear-gradient(180deg,primary,accent)',
        '.light{--primary:0 0 0}.dark{--primary:255 255 255}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(255 0 0))}',
        {
            variables: {
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
        '.light{--primary:0 0 0}.dark{--primary:255 255 255}:root{--accent:255 0 0}.dark{--accent:170 0 0}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}',
        {
            variables: {
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
        '.light{--fade:204 204 204}.dark{--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}',
        {
            variables: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            }
        }
    )
    testCSS(
        'btn',
        ':root{--primary-filled:220 160 0}.light{--primary-filled:236 187 64}.dark{--primary-filled:220 160 0}.bg\\:primary-filled,.btn{background-color:rgb(var(--primary-filled))}',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(gold-70)',
                        '@light': '$(gold-75)',
                        '@dark': '$(gold-70)'
                    }
                }
            },
            styles: {
                btn: 'bg:primary-filled'
            }
        }
    )
    testCSS(
        'bg:primary-filled',
        ':root{--primary-filled:220 160 0}.light{--primary-filled:236 187 64}.dark{--primary-filled:220 160 0}.bg\\:primary-filled,.btn{background-color:rgb(var(--primary-filled))}',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(gold-70)',
                        '@light': '$(gold-75)',
                        '@dark': '$(gold-70)'
                    }
                }
            },
            styles: {
                btn: 'bg:primary-filled'
            }
        }
    )
    testCSS(
        'bg:primary-filled@dark',
        '.dark .bg\\:primary-filled\\@dark{background-color:rgb(220 160 0)}',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(gold-70)',
                        '@light': '$(gold-75)',
                        '@dark': '$(gold-70)'
                    }
                }
            },
            styles: {
                btn: 'bg:primary-filled'
            }
        }
    )
    testCSS(
        'bg:code',
        '.dark{--code:251 224 157}.light{--code:220 160 0}.bg\\:code{background-color:rgb(var(--code))}',
        config
    )
    testCSS(
        'bg:code/.5',
        '.dark{--code:251 224 157}.light{--code:220 160 0}.bg\\:code\\/\\.5{background-color:rgb(var(--code)/.5)}',
        config
    )
    testCSS(
        'bg:fade-light',
        '.light{--fade-light:108 118 147}.bg\\:fade-light{background-color:rgb(var(--fade-light))}',
        config
    )
})

it('checks if similar color names collide.', () => {
    testCSS(
        'fg:a-1',
        '.fg\\:a-1{color:rgb(0 0 0)}',
        {
            variables: {
                a: {
                    1: '#000000'
                },
                aa: {
                    1: '#ff0000'
                }
            }
        }
    )
})