import { describe, test, expect } from 'vitest'
import { MasterCSS, config as defaultConfig } from '../src'

describe('issue #332 follow-up: logical borders + corner radii', () => {
    const cases: [string, string][] = [
        // Long-hand color
        ['border-inline-start-color:red',  'border-inline-start-color:'],
        ['border-inline-end-color:red',    'border-inline-end-color:'],
        ['border-block-start-color:red',   'border-block-start-color:'],
        ['border-block-end-color:red',     'border-block-end-color:'],
        ['border-inline-color:red',        'border-inline-color:'],
        ['border-block-color:red',         'border-block-color:'],
        // Long-hand style
        ['border-inline-start-style:dashed', 'border-inline-start-style:dashed'],
        ['border-inline-end-style:solid',    'border-inline-end-style:solid'],
        ['border-block-start-style:dotted',  'border-block-start-style:dotted'],
        ['border-block-end-style:none',      'border-block-end-style:none'],
        // Long-hand width
        ['border-inline-start-width:2',  'border-inline-start-width:0.125rem'],
        ['border-block-end-width:1',     'border-block-end-width:0.0625rem'],
        // Shorthands (auto-fill-solid → "Npx solid color")
        ['border-inline-start:1', 'border-inline-start:'],
        ['border-inline-end:1',   'border-inline-end:'],
        ['border-block-start:1',  'border-block-start:'],
        ['border-block-end:1',    'border-block-end:'],
        ['border-inline:1',       'border-inline:'],
        ['border-block:1',        'border-block:'],
        // Logical corner radii
        ['border-start-start-radius:8', 'border-start-start-radius:0.5rem'],
        ['border-start-end-radius:8',   'border-start-end-radius:0.5rem'],
        ['border-end-start-radius:8',   'border-end-start-radius:0.5rem'],
        ['border-end-end-radius:8',     'border-end-end-radius:0.5rem'],
    ]

    test.each(cases)('%s → %s', (input, expected) => {
        const css = new MasterCSS(undefined, defaultConfig)
        const rule = css.create(input)
        expect(rule).toBeDefined()
        expect(rule?.text).toContain(expected)
    })
})
