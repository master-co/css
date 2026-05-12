import { describe, test, expect } from 'vitest'
import { MasterCSS, createCSS } from '../../src'

describe('issue #346: CSS color functions are native variable values', () => {
    const cases: [string, string][] = [
        ['rgb', 'rgb(0 128 255)'],
        ['hsl', 'hsl(210 100% 50%)'],
        ['hwb', 'hwb(210 30% 20%)'],
        ['lab', 'lab(50% 40 -30)'],
        ['lch', 'lch(50% 60 200)'],
        ['oklab', 'oklab(0.5 0.1 -0.05)'],
        ['oklch', 'oklch(0.5 0.15 240)'],
        ['color-srgb', 'color(srgb 0.2 0.4 0.8)'],
        ['color-display-p3', 'color(display-p3 0.2 0.4 0.8)'],
        ['color-rec2020', 'color(rec2020 0.2 0.4 0.8)'],
    ]

    test.each(cases)('%s is preserved', (_, value) => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'primary', value }] })
        expect(css.variables.get('color-primary')).toMatchObject({
            type: 'string',
            value
        })
    })

    test('alpha alias becomes CSS runtime color-mix', () => {
        const css = createCSS({ variables: [{ namespace: 'color', key: 'primary', value: 'oklch(0.5 0.15 240)' }, { namespace: 'color', key: 'soft', value: '$(color-primary)/.3' }] }).add('bg:soft')
        expect(css.themeLayer.text).toContain('--color-soft:color-mix(in oklab,var(--color-primary) 30%,transparent)')
        expect(css.themeLayer.text).toContain('--color-primary:oklch(0.5 0.15 240)')
    })

    test('color-mix is preserved as a string variable', () => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'mix', value: 'color-mix(in oklch, red, blue)' }] })
        expect(css.variables.get('color-mix')).toMatchObject({
            type: 'string',
            value: 'color-mix(in oklch, red, blue)'
        })
    })
})
