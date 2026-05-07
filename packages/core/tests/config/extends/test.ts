import { it, test, expect } from 'vitest'
import { createCSS } from '../../../src'
import config from './master-css'

it.concurrent('config extends', () => {
    const css = createCSS(config)
    expect(css.config).toMatchObject({
        components: {
            'blue-btn': [
                { selector: '&', declarations: { 'font-size': '0.875rem' } },
                { selector: '&', declarations: { height: '2.5rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } },
                { selector: '&', declarations: { 'background-color': 'oklch(63.7% 0.237 25.331)' } }
            ],
            btn: [
                { selector: '&', declarations: { 'font-size': '0.875rem' } },
                { selector: '&', declarations: { height: '2.5rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } }
            ],
            btn3: [
                { selector: '&', declarations: { 'font-size': '0.9375rem' } },
                { selector: '&', declarations: { height: '5.625rem' } },
                { selector: '&', declarations: { 'text-align': 'center' } }
            ],
            btn4: [
                { selector: '&', declarations: { 'font-size': '12.5rem' } }
            ]
        }
    })
    expect(css.variables.get('first')).toMatchObject({ name: 'first', key: 'first', type: 'color', space: 'oklch', value: '0.18 0 0' })
    expect(css.variables.get('first')?.modes).toMatchObject({
        dark: { space: 'oklch', value: '0% 0 none' },
        light: { space: 'oklch', value: '0 0 0' }
    })
    expect(css.variables.get('second')).toMatchObject({ type: 'color' })
    expect(css.variables.get('second')?.modes).toMatchObject({
        dark: { space: 'oklch', value: '0% 0 none' },
        light: { space: 'oklch', value: '0 0 0', alpha: .5 }
    })
    expect(css.variables.get('third')).toMatchObject({ type: 'color', space: 'oklch', value: '0% 0 none' })
    expect(css.variables.get('third')?.modes).toMatchObject({ dark: { space: 'oklch', value: '100% 0 none' } })
    expect(css.variables.get('third-2')?.modes).toMatchObject({ dark: { space: 'oklch', value: '100% 0 none' } })
    expect(css.variables.get('fourth')).toMatchObject({ type: 'color', space: 'oklch', value: '0.18 0 0' })
})
