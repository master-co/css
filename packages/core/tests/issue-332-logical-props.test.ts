import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../src'

describe('issue #332: CSS logical properties', () => {
    const cases: [string, string][] = [
        // Logical sizing
        ['inline-size:16', 'inline-size:1rem'],
        ['block-size:16', 'block-size:1rem'],
        ['min-inline-size:16', 'min-inline-size:1rem'],
        ['min-block-size:16', 'min-block-size:1rem'],
        ['max-inline-size:16', 'max-inline-size:1rem'],
        ['max-block-size:16', 'max-block-size:1rem'],
        // Margin block (logical vertical)
        ['mbs:16', 'margin-block-start:1rem'],
        ['mbe:16', 'margin-block-end:1rem'],
        ['mb-block:16', 'margin-block:1rem'],
        // Padding block
        ['pbs:16', 'padding-block-start:1rem'],
        ['pbe:16', 'padding-block-end:1rem'],
        ['pb-block:16', 'padding-block:1rem'],
        // Logical inset
        ['inset-inline-start:0', 'inset-inline-start:0'],
        ['inset-inline-end:0', 'inset-inline-end:0'],
        ['inset-inline:0', 'inset-inline:0'],
        ['inset-block-start:0', 'inset-block-start:0'],
        ['inset-block-end:0', 'inset-block-end:0'],
        ['inset-block:0', 'inset-block:0']
    ]

    test.each(cases)('%s → %s', (input, expected) => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create(input)
        expect(rule).toBeDefined()
        expect(rule?.text).toContain(expected)
    })
})
