import { describe, expect, test } from 'vitest'
import { generateAt, generateSelector, parseAt, parseSelector } from '../src/compiler'
import { createDefaultCSS } from './helpers/css-tester'

describe.concurrent('compiled at-rule parser parity', () => {
    const cases = [
        ['print', '@media print'],
        ['base', '@layer base'],
        ['default', '@layer defaults'],
        ['!print', '@media not print'],
        ['start', '@starting-style'],
        ['>=sm', '@media (width>=52.125rem)'],
        ['<=sm', '@media (width<=52.125rem)'],
        ['height>=sm', '@media (height>=52.125rem)'],
        ['container(h>160)', '@container (height>10rem)'],
        ['screen&print', '@media screen and print'],
        ['screen,print', '@media screen or print'],
        ['sm&<=lg', '@media (width>=52.125rem) and (width<=80rem)']
    ] as const

    test.each(cases)('%s', (input, expected) => {
        const atRule = parseAt(input, createDefaultCSS())
        expect(generateAt(atRule)).toBe(expected)
    })
})

describe.concurrent('compiled selector parser parity', () => {
    const cases = [
        [':hover', '&:hover'],
        [':first', '&:first-child'],
        [':last', '&:last-child'],
        [':even', '&:nth-child(2n)'],
        [':odd', '&:nth-child(odd)'],
        [':nth(2)', '&:nth-child(2)'],
        [':not(:last)', '&:not(:last-child)'],
        [':has(:first)', '&:has(:first-child)'],
        ['::first-letter', '&::first-letter'],
        ['>.title', '&>.title'],
        ['_.feature__tab-title', '& .feature__tab-title']
    ] as const

    test.each(cases)('%s', (input, expected) => {
        const nodes = parseSelector(input, createDefaultCSS(), false)
        expect(generateSelector(nodes, '&')).toBe(expected)
    })
})
