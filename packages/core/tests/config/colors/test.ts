import { it, test } from 'vitest'
import config from '../../config'
import { expectLayers } from '../../test'

test.concurrent('colors', () => {
    expectLayers(
        {
            theme: ':root{--primary-stage-1:oklch(100% 0 none)}.light{--primary-stage-1:oklch(0% 0 none)}.dark{--primary-stage-1:oklch(100% 0 none)}',
            general: '.fg\\:primary-stage-1{color:var(--primary-stage-1)}'
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
            general: '.bg\\:primary-alpha{background-color:oklch(100% 0 none/0.1)}'
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
            general: '.bg\\:primary-rgb2{background-color:oklch(0% 0 none)}'
        },
        'bg:primary-rgb2',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-rgb3{background-color:rgb(0 0 0/0.5)}'
        },
        'bg:primary-rgb3',
        config
    )

    expectLayers(
        {
            general: '.bg\\:primary-2{background-color:rgb(0 0 0/0.35)}'
        },
        'bg:primary-2',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--major:oklch(0% 0 none)}.dark{--major:oklch(100% 0 none)}',
            general: '.bg\\:linear-gradient\\(180deg\\,major\\,black\\){background-image:linear-gradient(180deg,var(--major),oklch(0% 0 none))}'
        },
        'bg:linear-gradient(180deg,major,black)',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}.light,:root{--accent:rgb(17 17 17)}.dark{--accent:rgb(238 238 238)}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        {
            modes: {
                light: {
                    primary: '#000000',
                    accent: '#111111'
                },
                dark: {
                    primary: '#ffffff',
                    accent: '#eeeeee'
                }
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}.dark{--accent:rgb(238 238 238)}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        {
            modes: {
                light: {
                    primary: '#000000',
                },
                dark: {
                    primary: '#ffffff',
                    accent: '#eeeeee'
                }
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),accent)}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        {
            modes: {
                light: {
                    primary: '#000000'
                },
                dark: {
                    primary: '#ffffff'
                }
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}:root{--accent:rgb(255 0 0)}.dark{--accent:rgb(170 0 0)}',
            general: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        {
            variables: {
                accent: '#ff0000'
            },
            modes: {
                light: {
                    primary: '#000000'
                },
                dark: {
                    primary: '#ffffff',
                    accent: '#aa0000'
                }
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--fade:rgb(204 204 204)}.dark{--fade:rgb(51 51 51)}',
            general: '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:var(--fade)}'
        },
        '{block;fg:fade}_:where(p)_code:before',
        {
            modes: {
                light: {
                    fade: '#cccccc'
                },
                dark: {
                    fade: '#333333'
                }
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: ':root{--primary-filled:oklch(0% 0 none)}.light{--primary-filled:oklch(100% 0 none)}.dark{--primary-filled:oklch(0% 0 none)}',
            components: '.btn{background-color:var(--primary-filled)}'
        },
        'btn',
        {
            variables: {
                'primary-filled': '$black'
            },
            modes: {
                light: {
                    'primary-filled': '$white'
                },
                dark: {
                    'primary-filled': '$black'
                }
            },
            modeTrigger: 'class',
            components: {
                btn: 'bg:primary-filled'
            }
        }
    )

    expectLayers(
        {
            theme: ':root{--primary-filled:oklch(0% 0 none)}.light{--primary-filled:oklch(100% 0 none)}.dark{--primary-filled:oklch(0% 0 none)}',
            general: '.bg\\:primary-filled{background-color:var(--primary-filled)}'
        },
        'bg:primary-filled',
        {
            variables: {
                'primary-filled': '$black'
            },
            modes: {
                light: {
                    'primary-filled': '$white'
                },
                dark: {
                    'primary-filled': '$black'
                }
            },
            components: {
                btn: 'bg:primary-filled'
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            general: '.dark .bg\\:primary-filled\\@dark{background-color:oklch(100% 0 none)}'
        },
        'bg:primary-filled@dark',
        {
            variables: {
                'primary-filled': '$white'
            },
            modes: {
                light: {
                    'primary-filled': '$black'
                },
                dark: {
                    'primary-filled': '$white'
                }
            },
            components: {
                btn: 'bg:primary-filled'
            },
            modeTrigger: 'class'
        }
    )

    expectLayers(
        {
            theme: '.light,:root{--code:oklch(0% 0 none)}.dark{--code:oklch(100% 0 none)}',
            general: '.bg\\:code{background-color:var(--code)}'
        },
        'bg:code',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--code:oklch(0% 0 none)}.dark{--code:oklch(100% 0 none)}',
            general: '.bg\\:code\\/\\.5{background-color:color-mix(in oklab,var(--code) 50%,transparent)}'
        },
        'bg:code/.5',
        config
    )

})

it.concurrent('checks if similar color names collide.', () => {
    expectLayers(
        {
            general: '.fg\\:a-1{color:oklch(0 0 0)}'
        },
        'fg:a-1',
        {
            variables: {
                a: {
                    1: 'oklch(0 0 0)'
                },
                aa: {
                    1: 'oklch(1 0 0)'
                }
            }
        }
    )
})