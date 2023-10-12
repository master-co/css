import { MasterCSS } from '../../../src'
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
    expect(css.colors.first).toEqual({
        '': '#111111',
        'dark': '#c6dbfe',
        'light': '#000000'
    })
    expect(css.colors.second).toEqual({
        'dark': '#0e3496',
        'light': '#00000080'
    })
    expect(css.colors.third).toEqual({
        '': '#0e3496',
        'dark': '#175fe9'
    })
    expect(css.colors['third-2']).toEqual({
        'dark': '#6b9ef1'
    })
    expect(css.colors.fourth).toEqual({
        '': '#111111',
        'dark': '#175fe9',
        'light': '#000000'
    })
})