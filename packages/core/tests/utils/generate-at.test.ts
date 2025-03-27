import { test, expect } from 'vitest'
import { parseAt } from '../../src'
import generateAt from '../../src/utils/generate-at'

test.concurrent('types', () => {
    expect(generateAt(parseAt('print').atComponents)).toBe('print')
    expect(generateAt(parseAt('base').atComponents)).toBe('base')
    expect(generateAt(parseAt('preset').atComponents)).toBe('preset')
})

test.concurrent('& and', () => {
    expect(generateAt(parseAt('print&screen').atComponents)).toBe('print and screen')
    expect(generateAt(parseAt('(print)and(screen)').atComponents)).toBe('print and screen')
})

test.concurrent(',', () => {
    expect(generateAt(parseAt('print,screen').atComponents)).toBe('print or screen')
    expect(generateAt(parseAt('(print)or(screen)').atComponents)).toBe('print or screen')
})

test.concurrent('! not', () => {
    expect(generateAt(parseAt('not(print)').atComponents)).toBe('not print')
    expect(generateAt(parseAt('!print').atComponents)).toBe('not print')
})

test.concurrent('landscape', () => {
    expect(generateAt(parseAt('landscape').atComponents)).toBe('(orientation:landscape)')
})

test.concurrent('container', () => {
    expect(generateAt(parseAt('container(sidebar)sm').atComponents)).toBe('sidebar (width>=52.125rem)')
    expect(generateAt(parseAt('container(sm)').atComponents)).toBe('(width>=52.125rem)')
})

test.concurrent('>= <= > <', () => {
    expect(generateAt(parseAt('sm').atComponents)).toBe('(width>=52.125rem)')
    expect(generateAt(parseAt('<=sm').atComponents)).toBe('(width<=52.125rem)')
    expect(generateAt(parseAt('>=sm').atComponents)).toBe('(width>=52.125rem)')
    expect(generateAt(parseAt('>sm').atComponents)).toBe('(width>52.125rem)')
    expect(generateAt(parseAt('<sm').atComponents)).toBe('(width<52.125rem)')
    expect(generateAt(parseAt('=sm').atComponents)).toBe('(width=52.125rem)')
    expect(generateAt(parseAt('sm&<md').atComponents)).toBe('(width>=52.125rem) and (width<64rem)')
})

test.concurrent('nest', () => {
    expect(generateAt(parseAt('not(screen&(any-hover:hover))').atComponents))
        .toBe('not (screen and (any-hover:hover))')
})