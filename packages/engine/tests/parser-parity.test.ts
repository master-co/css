import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import { generateAt, generateSelector, parseAt, parseSelector } from '../src/compiler'
import { clonePlan, createDefaultCSS } from './helpers/css-tester'

describe.concurrent('compiled at-rule parser parity', () => {
    const cases = [
        ['print', '@media print'],
        ['base', '@layer base'],
        ['default', '@layer defaults'],
        ['!print', '@media not print'],
        ['start', '@starting-style'],
        ['and()', '@media and'],
        ['or', '@media or'],
        ['not', '@media not'],
        [',', '@media or'],
        ['!', '@media not'],
        ['&', '@media and'],
        ['>=sm', '@media (width>=52.125rem)'],
        ['<=sm', '@media (width<=52.125rem)'],
        ['>sm', '@media (width>52.125rem)'],
        ['<sm', '@media (width<52.125rem)'],
        ['=sm', '@media (width=52.125rem)'],
        ['height>=sm', '@media (height>=52.125rem)'],
        ['w>=sm', '@media (width>=52.125rem)'],
        ['h>=sm', '@media (height>=52.125rem)'],
        ['container(h>160)', '@container (height>10rem)'],
        ['sidebar(sm)', '@container sidebar (width>=24rem)'],
        ['screen&print', '@media screen and print'],
        ['screen,print', '@media screen or print'],
        ['!screen', '@media not screen'],
        ['sm&<=lg', '@media (width>=52.125rem) and (width<=80rem)'],
        ['@media', '@media']
    ] as const

    test.each(cases)('%s', (input, expected) => {
        const atRule = parseAt(input, createDefaultCSS())
        expect(generateAt(atRule)).toBe(expected)
    })

    test('resolves custom at-rule and condition aliases from the compiled plan', () => {
        const plan = clonePlan()
        plan.atRules = {
            ...(plan.atRules || {}),
            'supports-backdrop': {
                id: 'supports',
                nodes: [{
                    type: 'group',
                    children: [{ type: 'string', value: 'backdrop-filter:blur(0px)' }]
                }]
            }
        }
        const css = createCSS(plan)

        expect(generateAt(parseAt('supports-backdrop', css))).toBe('@supports (backdrop-filter:blur(0px))')
        expect(generateAt(parseAt('container(sm)', css))).toBe('@container (width>=24rem)')
        expect(generateAt(parseAt('container(md)', css))).toBe('@container (width>=28rem)')
    })
})

describe.concurrent('compiled selector parser parity', () => {
    const cases = [
        ['.class', '&.class'],
        [':hover', '&:hover'],
        [':first', '&:first-child'],
        [':last', '&:last-child'],
        [':even', '&:nth-child(2n)'],
        [':odd', '&:nth-child(odd)'],
        [':nth(2)', '&:nth-child(2)'],
        ['[open]', '&[open]'],
        [':has(.active)', '&:has(.active)'],
        [':of(.active)', '.active &'],
        [':of(#active)', '#active &'],
        [':of(active)', 'active &'],
        [':of(.active_)', '.active &'],
        [':of(.active>)', '.active>&'],
        [':first:focus:disabled', '&:first-child:focus:disabled'],
        [':not(:last)', '&:not(:last-child)'],
        [':has(:first)', '&:has(:first-child)'],
        ['::first-letter', '&::first-letter'],
        ['>.title', '&>.title'],
        ['*', '&*'],
        ['_hr+*', '& hr+*'],
        [':hover+div:has(:active)', '&:hover+div:has(:active)'],
        ['>li::before,>li::after', '&>li::before,&>li::after'],
        ['_.feature__tab-title', '& .feature__tab-title']
    ] as const

    test.each(cases)('%s', (input, expected) => {
        const nodes = parseSelector(input, createDefaultCSS(), false)
        expect(generateSelector(nodes, '&')).toBe(expected)
    })
})
