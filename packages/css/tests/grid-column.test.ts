test('grid-column', () => {
    expect(new MasterCSS().create('grid-col-span:2')?.text).toBe('.grid-col-span\\:2{grid-column:span 2/span 2}')
    expect(new MasterCSS().create('grid-column-span:2')?.text).toBe('.grid-column-span\\:2{grid-column:span 2/span 2}')
})
