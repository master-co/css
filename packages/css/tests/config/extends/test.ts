import { MasterCSS } from '../../../src'
import { config } from './master-css'

it('config extends', () => {
    const css = new MasterCSS(config)
    expect(css.config.classes).toEqual({
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
    expect(css.colorThemesMap.first).toEqual({
        '': '#111111',
        'dark': '#c6dbfe',
        'light': '#000000'
    })
    expect(css.colorThemesMap.second).toEqual({
        'dark': '#0e3496',
        'light': '#00000080'
    })
    expect(css.colorThemesMap.third).toEqual({
        '': '#0e3496',
        'dark': '#175fe9'
    })
    expect(css.colorThemesMap['third-2']).toEqual({
        'dark': '#6b9ef1'
    })
    expect(css.colorThemesMap.fourth).toEqual({
        '': '#111111',
        'dark': '#175fe9',
        'light': '#000000'
    })
})