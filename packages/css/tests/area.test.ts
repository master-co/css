test('area', () => {
    expect(new MasterCSS().create('full')?.text).toContain('width:100%;height:100%')
})
