import config from '../../config'
test('colors', () => {
    expect(new MasterCSS(config).add('fg:primary').text)
        .toBe(':root{--primary:23 95 233}.light{--primary:235 187 64}.dark{--primary:251 224 157}.fg\\:primary{color:rgb(var(--primary))}')

    expect(new MasterCSS(config).add('fg:primary-code').text)
        .toBe(':root{--primary-code:119 119 119}.dark{--primary-code:107 106 109}.fg\\:primary-code{color:rgb(var(--primary-code))}')

    expect(new MasterCSS(config).add('fg:primary-stage-1').text)
        .toBe(':root{--primary-stage-1:153 153 153}.light{--primary-stage-1:136 136 136}.dark{--primary-stage-1:170 170 170}.fg\\:primary-stage-1{color:rgb(var(--primary-stage-1))}')

    expect(new MasterCSS(config).add('b:input').text)
        .toBe('.b\\:input{border-color:rgb(18 52 86)}')

    expect(new MasterCSS({
        variables: {
            'blue-100': '#777'
        }
    }).add('bg:blue-100').text)
        .toBe('.bg\\:blue-100{background-color:rgb(119 119 119)}')

    expect(new MasterCSS(config).add('bg:primary-alpha').text)
        .toBe('.bg\\:primary-alpha{background-color:rgb(23 95 233 / .1)}')

    expect(new MasterCSS(config).add('bg:primary-rgb1').text)
        .toBe('.bg\\:primary-rgb1{background-color:rgb(0 0 0)}')

    expect(new MasterCSS(config).add('bg:primary-rgb2').text)
        .toBe('.bg\\:primary-rgb2{background-color:rgb(0 0 0)}')

    expect(new MasterCSS(config).add('bg:primary-rgb3').text)
        .toBe('.bg\\:primary-rgb3{background-color:rgb(0 0 0 / .5)}')

    expect(new MasterCSS(config).add('bg:primary-rgb4').text)
        .toBe('.bg\\:primary-rgb4{background-color:rgb(0 0 0 / .5)}')

    expect(new MasterCSS(config).add('bg:primary-2').text)
        .toBe('.bg\\:primary-2{background-color:rgb(0 0 0 / .35)}')

    expect(new MasterCSS(config).add('bg:linear-gradient(180deg,major,gray-60)').text)
        .toBe('.light{--major:25 33 45}.dark{--major:218 217 219}.bg\\:linear-gradient\\(180deg\\,major\\,gray-60\\){background-image:linear-gradient(180deg,rgb(var(--major)),rgb(158 157 160))}')

    expect(new MasterCSS({
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
    }).add('bg:linear-gradient(180deg,primary,accent)').text)
        .toBe('.light{--primary:0 0 0;--accent:17 17 17}.dark{--primary:255 255 255;--accent:238 238 238}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}')

    expect(new MasterCSS({
        variables: {
            primary: {
                '@light': '#000000',
                '@dark': '#ffffff'
            },
            accent: {
                '@dark': '#eeeeee'
            }
        }
    }).add('bg:linear-gradient(180deg,primary,accent)').text)
        .toBe('.light{--primary:0 0 0}.dark{--primary:255 255 255;--accent:238 238 238}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}')

    expect(new MasterCSS({
        variables: {
            primary: {
                '@light': '#000000',
                '@dark': '#ffffff'
            }
        }
    }).add('bg:linear-gradient(180deg,primary,accent)').text)
        .toBe('.light{--primary:0 0 0}.dark{--primary:255 255 255}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),accent)}')

    expect(new MasterCSS({
        variables: {
            accent: '#ff0000',
            primary: {
                '@light': '#000000',
                '@dark': '#ffffff'
            }
        }
    }).add('bg:linear-gradient(180deg,primary,accent)').text)
        .toBe('.light{--primary:0 0 0}.dark{--primary:255 255 255}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(255 0 0))}')

    expect(new MasterCSS({
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
    }).add('bg:linear-gradient(180deg,primary,accent)').text)
        .toBe('.light{--primary:0 0 0}.dark{--primary:255 255 255;--accent:170 0 0}:root{--accent:255 0 0}.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,rgb(var(--primary)),rgb(var(--accent)))}')

    expect(new MasterCSS({
        variables: {
            fade: {
                '@light': '#cccccc',
                '@dark': '#333333'
            }
        }
    }).add('{block;fg:fade}_:where(p)_code:before').text)
        .toBe('.light{--fade:204 204 204}.dark{--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}')

    expect(new MasterCSS({
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
    }).add('btn').text)
        .toBe(':root{--primary-filled:220 160 0}.light{--primary-filled:236 187 64}.dark{--primary-filled:220 160 0}.bg\\:primary-filled,.btn{background-color:rgb(var(--primary-filled))}')

    expect(new MasterCSS({
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
    }).add('bg:primary-filled').text)
        .toBe(':root{--primary-filled:220 160 0}.light{--primary-filled:236 187 64}.dark{--primary-filled:220 160 0}.bg\\:primary-filled,.btn{background-color:rgb(var(--primary-filled))}')

    expect(new MasterCSS({
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
    }).add('bg:primary-filled@dark').text)
        .toBe('.dark .bg\\:primary-filled\\@dark{background-color:rgb(220 160 0)}')

    expect(new MasterCSS(config).add('bg:code').text)
        .toBe('.dark{--code:251 224 157}.light{--code:220 160 0}.bg\\:code{background-color:rgb(var(--code))}')

    expect(new MasterCSS(config).add('bg:code/.5').text)
        .toBe('.dark{--code:251 224 157}.light{--code:220 160 0}.bg\\:code\\/\\.5{background-color:rgb(var(--code)/.5)}')

    expect(new MasterCSS(config).add('bg:fade-light').text)
        .toBe('.light{--fade-light:108 118 147}.bg\\:fade-light{background-color:rgb(var(--fade-light))}')

})

it('checks if similar color names collide.', () => {
    expect(new MasterCSS({
        variables: {
            a: {
                1: '#000000'
            },
            aa: {
                1: '#ff0000'
            }
        }
    }).add('fg:a-1').text).toBe('.fg\\:a-1{color:rgb(0 0 0)}')
})