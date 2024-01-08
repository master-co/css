import { config } from './master-css'

it('config extends', () => {
    const css = new MasterCSS(config)
    expect(css.config.styles).toEqual({
        'blue': {
            'btn': {
                '': 'btn bg:blue',
            },
        },
        'btn': {
            '': 'font:14 h:40 text:center'
        },
        'btn3': {
            '': 'font:15 h:90 text:center'
        },
        'btn4': {
            '': 'font:200'
        },
    })
    expect(css.variables.first).toEqual({
        type: 'color',
        space: 'rgb',
        value: '17 17 17',
        themes: {
            dark: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0'
            },
            light: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0'
            }
        }
    })
    expect(css.variables.second).toEqual({
        type: 'color',
        space: 'rgb',
        themes: {
            dark: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0'
            },
            light: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0 / .5'
            }
        }
    })
    expect(css.variables.third).toEqual({
        type: 'color',
        space: 'rgb',
        value: '0 0 0',
        themes: {
            dark: {
                space: 'rgb',
                type: 'color',
                value: '58 124 255'
            }
        }
    })
    expect(css.variables['third-2']).toEqual({
        type: 'color',
        space: 'rgb',
        themes: {
            dark: {
                space: 'rgb',
                type: 'color',
                value: '37 99 253'
            }
        }
    })
    expect(css.variables.fourth).toEqual({
        type: 'color',
        space: 'rgb',
        value: '17 17 17',
        themes: {
            dark: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0'
            },
            light: {
                space: 'rgb',
                type: 'color',
                value: '0 0 0'
            }
        }
    })
})