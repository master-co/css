test('caret', () => {
    expect(new MasterCSS().create('caret:current')?.text).toContain('caret-color:currentColor')
    expect(new MasterCSS().create('caret:transparent')?.text).toContain('caret-color:transparent')
})
