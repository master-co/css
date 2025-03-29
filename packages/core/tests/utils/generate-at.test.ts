import { test, expect, describe } from 'vitest'
import { parseAt } from '../../src'
import generateAt from '../../src/utils/generate-at'

describe('id', () => {
    test.concurrent('print', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media print'))
    test.concurrent('base', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@layer base'))
    test.concurrent('preset', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@layer preset'))
    test.concurrent('!print', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media not print'))
})

test.concurrent('screen&print', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media screen and print')
})

test.concurrent('(print)and(screen)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media print and screen')
})

test.concurrent('screen,print', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media screen or print')
})

test.concurrent('(print)or(screen)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media print or screen')
})

test.concurrent('not(print)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media not print')
})

test.concurrent('landscape', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@media (orientation:landscape)')
})

test.concurrent('starting-style', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@starting-style')
})

test.concurrent('container(sidebar)sm', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@container sidebar (width>=52.125rem)')
    expect(generateAt(parseAt('container(sm)'))).toBe('@container (width>=52.125rem)')
})

test.concurrent('container(sm)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@container (width>=52.125rem)')
})

test.concurrent('layer(modifiers)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@layer modifiers')
})

test.concurrent('supports(transform-origin:5%|5%)', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@supports (transform-origin:5% 5%)')
})

test.concurrent('supports(selector(:has(*)))', ({ task }) => {
    expect(generateAt(parseAt(task.name))).toBe('@supports (selector(:has(*)))')
})

test.concurrent('sm', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width>=52.125rem)'))
test.concurrent('<=sm', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width<=52.125rem)'))
test.concurrent('>=sm', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width>=52.125rem)'))
test.concurrent('>sm', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width>52.125rem)'))
test.concurrent('<sm', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width<52.125rem)'))
test.concurrent('sm&<md', ({ task }) => expect(generateAt(parseAt(task.name))).toBe('@media (width>=52.125rem) and (width<64rem)'))

test.concurrent('media(width<=1024)&(width>=1280)', ({ task }) => {
    expect(parseAt(task.name).components).toEqual([
        { token: '<=1024', name: 'width', type: 'number', value: 64, unit: 'rem', operator: '<=' },
        { token: '&', type: 'logical', value: 'and' },
        { token: '>=1280', name: 'width', type: 'number', value: 80, unit: 'rem', operator: '>=' },
    ])
})

test.concurrent('not(screen&(any-hover:hover))', ({ task }) => {
    expect(generateAt(parseAt(task.name)))
        .toBe('@media not (screen and (any-hover:hover))')
})