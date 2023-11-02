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
    expect(css.colorVariables.first).toEqual({
        '': {
            space: 'rgb',
            type: 'color',
            value: '17 17 17'
        },
        '@dark': {
            space: 'rgb',
            type: 'color',
            value: '198 219 254'
        },
        '@light': {
            space: 'rgb',
            type: 'color',
            value: '0 0 0'
        }
    })
    expect(css.colorVariables.second).toEqual({
        '@dark': {
            space: 'rgb',
            type: 'color',
            value: '14 52 150'
        },
        '@light': {
            space: 'rgb',
            type: 'color',
            value: '0 0 0 / .5'
        }
    })
    expect(css.colorVariables.third).toEqual({
        '': {
            space: 'rgb',
            type: 'color',
            value: '14 52 150'
        },
        '@dark': {
            space: 'rgb',
            type: 'color',
            value: '23 95 233'
        }
    })
    expect(css.colorVariables['third-2']).toEqual({
        '@dark': {
            space: 'rgb',
            type: 'color',
            value: '107 158 241'
        }
    })
    expect(css.colorVariables.fourth).toEqual({
        '': {
            space: 'rgb',
            type: 'color',
            value: '17 17 17'
        },
        '@dark': {
            space: 'rgb',
            type: 'color',
            value: '23 95 233'
        },
        '@light': {
            space: 'rgb',
            type: 'color',
            value: '0 0 0'
        }
    })
})