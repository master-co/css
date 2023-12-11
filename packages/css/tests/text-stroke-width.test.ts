test('text-stroke-width', () => {
    expect(new MasterCSS().create('text-stroke:thin')?.text).toContain('-webkit-text-stroke-width:thin')
    expect(new MasterCSS().create('text-stroke-width:thin')?.text).toContain('text-stroke-width:thin')
})