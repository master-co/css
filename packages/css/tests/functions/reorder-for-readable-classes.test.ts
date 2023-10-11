import { reorderForReadableClasses } from '../../src'
import shuffle from 'shuffle-array'

test('mixed', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'font:12 font:32@sm font:48@lg m:32 block my:16 px:16 my:32@lg bg:red bg:purple:focus bg:blue:hover round mb:48'.split(' ')
        ))).toEqual(
            'block round bg:red bg:blue:hover bg:purple:focus font:12 font:32@sm font:48@lg m:32 mb:48 my:16 my:32@lg px:16'.split(' ')
        )
    }
})

test('selectors', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'block:active display:block block:hover block[data-id] block:has(:focus) block:disabled block block[required]'.split(' ')
        ))).toEqual(
            'block block[data-id] block[required] block:hover block:has(:focus) block:active block:disabled display:block'.split(' ')
        )
    }
})

test('theme modes', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'bg:slate-90@light bg:white/.1@dark bg:red'.split(' ')
        ))).toEqual(
            'bg:red bg:white/.1@dark bg:slate-90@light'.split(' ')
        )
    }
})

test('responsive breakpoints', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'font:12 font:24@sm font:36@lg'.split(' ')
        ))).toEqual(
            'font:12 font:24@sm font:36@lg'.split(' ')
        )
    }
})