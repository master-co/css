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

    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'font:12 font:32@md font:24@sm m:32 block px:16 bg:blue:hover round mb:48'.split(' ')
        ))).toEqual(
            'block round bg:blue:hover font:12 font:24@sm font:32@md m:32 mb:48 px:16'.split(' ')
        )
    }

    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'abs inset:0 m:auto height:fit text:center font:7vw font:40@xs font:heavy fg:white blend:overlay @flash|3s|infinit'.split(' ')
        ))).toEqual(
            'abs @flash|3s|infinit blend:overlay fg:white font:7vw font:40@xs font:heavy height:fit inset:0 m:auto text:center'.split(' ')
        )
    }
})

it('sorts by layers', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'b:1|blue b:1'.split(' ')
        ))).toEqual(
            'b:1 b:1|blue'.split(' ')
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

test('collision properties', () => {
    for (let i = 0; i < 10; i++) {
        expect(reorderForReadableClasses(shuffle(
            'm:10 m:20 m:30:hover m:40@dark'.split(' ')
        ))).toEqual(
            'm:10 m:20 m:30:hover m:40@dark'.split(' ')
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