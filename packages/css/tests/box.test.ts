test('box', () => {
    expect(new MasterCSS().create('box:content')?.text).toContain('box-sizing:content-box')
    expect(new MasterCSS().create('box-sizing:content-box')?.text).toContain('box-sizing:content-box')
})