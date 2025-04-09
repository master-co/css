import { it, test } from 'vitest'
import config from '../../config'
import { expectLayers } from '../../test'

test.concurrent('colors', () => {
    expectLayers(
        {
            theme: ':root{--primary:0 0 0}.light{--primary:0 0 0}.dark{--primary:255 255 255}',
            general: '.fg\\:primary{color:rgb(var(--primary))}'
        },
        'fg:primary',
        config
    )

    expectLayers(
        {
            theme: ':root{--primary-code:0 0 0}.dark{--primary-code:255 255 255}',
            general: '.fg\\:primary-code{color:rgb(var(--primary-code))}'
        },
        'fg:primary-code',
        config
    )

    expectLayers(
        {
            theme: ':root{--primary-stage-1:255 255 255}.light{--primary-stage-1:0 0 0}.dark{--primary-stage-1:255 255 255}',
            general: '.fg\\:primary-stage-1{color:rgb(var(--primary-stage-1))}'
        },
        'fg:primary-stage-1',
        config
    )

    expectLayers(
        {
            general: '.b\\:input{border-color:rgb(18 52 86)}'
        },
        'b:input',
        config
    )

    expectLayers(
        {
            general: '.bg\\:blue-100{background-color:rgb(119 119 119)}'
        },
        'bg:blue-100',
        {
            variables: {
                'blue-100': '#777'
            }
        }
    )

    expectLayers(
        {
            general: '.bg\\:primary-alpha{background-color:rgb(255 255 255 / .1)}'
        },
        'bg:primary-alpha',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-rgb1{background-color:rgb(0 0 0)}'
        },
        'bg:primary-rgb1',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-rgb2{background-color:rgb(0 0 0)}'
        },
        'bg:primary-rgb2',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-rgb3{background-color:rgb(0 0 0 / .5)}'
        },
        'bg:primary-rgb3',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-rgb4{background-color:rgb(0 0 0 / .5)}'
        },
        'bg:primary-rgb4',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-2{background-color:rgb(0 0 0 / .35)}'
        },
        'bg:primary-2',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--major:0 0 0}.dark{--major:255 255 255}',
            general: '.bg\\:linear-gradient\\(180deg\\,major\\,black\\){background-image:linear-gradient(180deg,rgb(var(--major)),rgb(0 0 0))}'
        },
        'bg:linear-gradient(180deg,major,black)',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:0 0 0}.dark{--primary:255 255 255}.light,:root{--accent:17 17 17}.dark{--accent:238 238 238}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
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

    expectLayers(
        {
            theme: '.light,:root{--primary:0 0 0}.dark{--primary:255 255 255}.dark{--accent:238 238 238}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
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

    expectLayers(
        {
            theme: '.light,:root{--primary:0 0 0}.dark{--primary:255 255 255}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),accent)}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        {
            variables: {
                primary: {
                    '@light': '#000000',
                    '@dark': '#ffffff'
                }
            }
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:0 0 0}.dark{--primary:255 255 255}:root{--accent:255 0 0}.dark{--accent:170 0 0}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
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

    expectLayers(
        {
            theme: '.light,:root{--fade:204 204 204}.dark{--fade:51 51 51}',
            general: '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}'
        },
        '{block;fg:fade}_:where(p)_code:before',
        {
            variables: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            }
        }
    )

    expectLayers(
        {
            theme: ':root{--primary-filled:0 0 0}.light{--primary-filled:255 255 255}.dark{--primary-filled:0 0 0}',
            components: '.btn{background-color:rgb(var(--primary-filled))}'
        },
        'btn',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(black)',
                        '@light': '$(white)',
                        '@dark': '$(black)'
                    }
                }
            },
            components: {
                btn: 'bg:primary-filled'
            }
        }
    )

    expectLayers(
        {
            theme: ':root{--primary-filled:0 0 0}.light{--primary-filled:255 255 255}.dark{--primary-filled:0 0 0}',
            general: '.bg\\:primary-filled{background-color:rgb(var(--primary-filled))}'
        },
        'bg:primary-filled',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(black)',
                        '@light': '$(white)',
                        '@dark': '$(black)'
                    }
                }
            },
            components: {
                btn: 'bg:primary-filled'
            }
        }
    )

    expectLayers(
        {
            general: '.dark .bg\\:primary-filled\\@dark{background-color:rgb(255 255 255)}'
        },
        'bg:primary-filled@dark',
        {
            variables: {
                primary: {
                    filled: {
                        '': '$(white)',
                        '@light': '$(black)',
                        '@dark': '$(white)'
                    }
                }
            },
            components: {
                btn: 'bg:primary-filled'
            }
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--code:0 0 0}.dark{--code:255 255 255}',
            general: '.bg\\:code{background-color:rgb(var(--code))}'
        },
        'bg:code',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--code:0 0 0}.dark{--code:255 255 255}',
            general: '.bg\\:code\\/\\.5{background-color:rgb(var(--code)/.5)}'
        },
        'bg:code/.5',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--fade-light:0 0 0}',
            general: '.bg\\:fade-light{background-color:rgb(var(--fade-light))}'
        },
        'bg:fade-light',
        config
    )
})

it.concurrent('checks if similar color names collide.', () => {
    expectLayers(
        {
            general: '.fg\\:a-1{color:rgb(0 0 0)}'
        },
        'fg:a-1',
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