import parseHTML from '../src/parse-html'

test('basic', ()=> {
    expect(parseHTML('<div class="a b c"></div>').classes).toEqual(['a', 'b', 'c'])
})