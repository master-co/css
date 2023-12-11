test('oreder', () => {
    expect(new MasterCSS().create('order:1')?.declarations).toStrictEqual({ order: '1' })
    expect(new MasterCSS().create('o:1')?.declarations).toStrictEqual({ order: '1' })
})
