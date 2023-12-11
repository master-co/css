test('grouping selectors', () => {
    expect(new MasterCSS().create('{fg:yellow;bg:red}_h1,_button')?.text).toBe('.\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button h1,.\\{fg\\:yellow\\;bg\\:red\\}_h1\\,_button button{color:rgb(128 103 0);background-color:rgb(209 26 30)}')
    // expect(new MasterCSS().create('block:before,:after')?.text).toBe('.block\\:before\\,\\:after:before,.block\\:before\\,\\:after:after{display:block}')
})
