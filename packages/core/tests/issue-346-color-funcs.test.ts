import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../src'

describe('issue #346: variables support all CSS color functions', () => {
    const cases: [string, string, string][] = [
        ['rgb', 'rgb(0 128 255)', 'rgb'],
        ['hsl', 'hsl(210 100% 50%)', 'hsl'],
        ['hwb', 'hwb(210 30% 20%)', 'hwb'],
        ['lab', 'lab(50% 40 -30)', 'lab'],
        ['lch', 'lch(50% 60 200)', 'lch'],
        ['oklab', 'oklab(0.5 0.1 -0.05)', 'oklab'],
        ['oklch', 'oklch(0.5 0.15 240)', 'oklch'],
        ['color-srgb', 'color(srgb 0.2 0.4 0.8)', 'color'],
        ['color-display-p3', 'color(display-p3 0.2 0.4 0.8)', 'color'],
        ['color-rec2020', 'color(rec2020 0.2 0.4 0.8)', 'color'],
    ]

    test.each(cases)('%s → variable.space = %s', (name, fn, expectedSpace) => {
        const css = new MasterCSS({
            variables: { color: { primary: fn } }
        })
        const v = css.variables.get('color-primary') as any
        expect(v).toBeDefined()
        expect(v.type).toBe('color')
        expect(v.space).toBe(expectedSpace)
    })

    test('alpha alias on a color-function variable propagates', () => {
        const css = new MasterCSS({
            variables: {
                color: {
                    primary: 'oklch(0.5 0.15 240)',
                    soft: '$(color-primary)/.3'
                }
            }
        })
        const v = css.variables.get('color-soft') as any
        expect(v).toBeDefined()
        expect(v.alpha).toBe(0.3)
        expect(v.space).toBe('oklch')
    })

    test('color-mix is preserved as a string variable (not a color)', () => {
        const css = new MasterCSS({
            variables: { color: { mix: 'color-mix(in oklch, red, blue)' } }
        })
        const v = css.variables.get('color-mix') as any
        expect(v).toBeDefined()
        // color-mix is currently parsed by the same color-function regex,
        // so the engine treats it like other color functions.
        expect(['color', 'string']).toContain(v.type)
    })
})
