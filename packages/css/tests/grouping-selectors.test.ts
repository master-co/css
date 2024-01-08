test('grouping selectors', () => {
    expect(new MasterCSS().create('{fg:white;bg:black}_h1,_button')?.text).toBe('.\\{fg\\:white\\;bg\\:black\\}_h1\\,_button h1,.\\{fg\\:white\\;bg\\:black\\}_h1\\,_button button{color:rgb(255 255 255);background-color:rgb(0 0 0)}')
    // expect(new MasterCSS().create('block:before,:after')?.text).toBe('.block\\:before\\,\\:after:before,.block\\:before\\,\\:after:after{display:block}')
})
