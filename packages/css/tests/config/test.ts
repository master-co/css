import { MasterCSS } from '../../src'
import { config } from './master-css'

it('config extends', () => {
    const css = new MasterCSS(config)
    expect(css.config.classes).toEqual({
        'blue': {
            'btn': {
                '': 'btn bg:blue',
            },
        },
        'btn': 'font:20 h:75 text:center',
        'btn3': 'font:15 h:90 text:center',
        'btn4': 'font:200',
    })
})