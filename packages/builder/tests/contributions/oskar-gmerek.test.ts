import CSSBuilder from '../../src'
import { test, expect } from 'vitest'

test('Oskar', () => {
    const builder = new CSSBuilder({}, __dirname).init()
    expect(
        builder?.extract('test.tsx',
            `
            <div class="hidden flex@sm">
            <div class="display:hidden p:15 flex@sm  gap:5  ">
            <div class="scale(.5)@sm">
        `)
    ).toEqual([
        'hidden',
        'flex@sm',
        'display:hidden',
        'p:15',
        'gap:5',
        'scale(.5)@sm',
    ])
})
