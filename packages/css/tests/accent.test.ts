test('accent', () => {
    expect(new MasterCSS().create('accent:current')?.text).toContain('accent-color:currentColor')
    // expect(new MasterCSS().create('accent:transparent')?.text).toContain('accent-color:transparent')
})
