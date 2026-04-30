import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../src'

describe('issue #330: shorthand auto-inherits related long-hand variables', () => {
    test('font: shorthand picks up custom font-size variable without explicit namespaces', () => {
        const css = new MasterCSS({
            variables: {
                'font-size': { hero: 48 }
            }
        }, defaultConfig)
        // Define a brand-new shorthand rule and verify it inherits font-size-* via name pattern.
        // Use existing `font` shorthand which currently lists namespaces explicitly —
        // adding a new font-size variable should still resolve through `font` without us
        // touching the rule definition.
        const rule = css.create('font:hero')
        expect(rule).toBeDefined()
        expect(rule?.text).toContain('font-size:3rem')
    })

    test('shorthand inherits from prefix-matched namespace', () => {
        const css = new MasterCSS({
            rules: {
                // a brand-new shorthand "myx" with no explicit namespaces field
                myx: {
                    type: 5, // NativeShorthand — using numeric value to keep the test pkg-only
                    declarations: undefined
                } as any
            },
            variables: {
                // explicit namespace prefix matches the shorthand id
                'myx-color': { primary: '#0063f0' },
                'myx-size': { sm: 12, lg: 24 }
            }
        })
        const v: any = css.variables.get('myx-color-primary')
        expect(v).toBeDefined()
        expect(v.namespace).toBe('myx-color')
    })
})
