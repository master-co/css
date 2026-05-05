import { it, test, expect } from 'vitest'
import parseHTML from '../src/parse-html'

test('basic', ()=> {
    expect(parseHTML('<div class="a b c"></div>').classes).toEqual(['a', 'b', 'c'])
})

test('splits classes by html whitespace and ignores empty tokens', () => {
    expect(parseHTML('<div class=" a\tb\nc  d "></div>').classes).toEqual(['a', 'b', 'c', 'd'])
})
