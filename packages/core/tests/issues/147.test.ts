import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../../src'

describe('issue #147: hsl() values stay as native CSS variable values', () => {
    test('hsl() string in variables.color is preserved', () => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'primary', value: 'hsl(210 100% 50%)' }] })
        const v = css.variables.get('color-primary')
        expect(v).toMatchObject({
            type: 'string',
            value: 'hsl(210 100% 50%)'
        })
    })

    test('hsl() with alpha is preserved', () => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'primary', value: 'hsl(210 100% 50% / 0.5)' }] })
        expect(css.variables.get('color-primary')?.value).toBe('hsl(210 100% 50% / 0.5)')
    })

    test('hsl() in flat color keys keeps namespace metadata', () => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'brand-primary', value: 'hsl(210 100% 50%)' }, { namespace: 'color', key: 'brand-secondary', value: 'hsl(290 80% 40%)' }] })
        expect(css.variables.get('color-brand-primary')).toMatchObject({ namespace: 'color', value: 'hsl(210 100% 50%)' })
        expect(css.variables.get('color-brand-secondary')).toMatchObject({ namespace: 'color', value: 'hsl(290 80% 40%)' })
    })

    test('legacy comma-separated hsl() is preserved', () => {
        const css = new MasterCSS({ variables: [{ namespace: 'color', key: 'primary', value: 'hsl(210, 100%, 50%)' }] })
        expect(css.variables.get('color-primary')?.value).toBe('hsl(210, 100%, 50%)')
    })
})
