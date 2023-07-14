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
            '': 'font:20 h:75 text:center'
        },
        'btn3': {
            '': 'font:15 h:90 text:center'
        },
        'btn4': {
            '': 'font:200'
        },
    })
    expect(css.config.colors?.first).toEqual({
        '': '#111111',
        '@dark': 'blue-80',
        '@light': 'rgb(0, 0, 0)'
    })
    expect(css.config.colors?.second).toEqual({
        '@dark': 'blue-30',
        '@light': 'rgba(0 0 0/.5)'
    })
    expect(css.config.colors?.third).toEqual({
        '': 'blue-30',
        '@dark': 'blue-50',
        '2': {
            '@dark': 'blue-60'
        }
    })
})