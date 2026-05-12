import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../../src'

describe('issue #215: touch: shorthand for touch-action', () => {
    const cases: [string, string][] = [
        ['touch:auto', 'touch-action:auto'],
        ['touch:none', 'touch-action:none'],
        ['touch:pan-x', 'touch-action:pan-x'],
        ['touch:pan-y', 'touch-action:pan-y'],
        ['touch:pan-left', 'touch-action:pan-left'],
        ['touch:pan-right', 'touch-action:pan-right'],
        ['touch:pan-up', 'touch-action:pan-up'],
        ['touch:pan-down', 'touch-action:pan-down'],
        ['touch:pinch-zoom', 'touch-action:pinch-zoom'],
        ['touch:manipulation', 'touch-action:manipulation']
    ]

    test.each(cases)('%s → %s', (input, expected) => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create(input)
        expect(rule).toBeDefined()
        expect(rule?.text).toContain(expected)
    })

    test('touch-action: long form still works (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('touch-action:none')
        expect(rule?.text).toContain('touch-action:none')
    })
})
