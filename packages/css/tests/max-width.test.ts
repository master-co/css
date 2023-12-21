test('max-width', () => {
    expect(new MasterCSS().create('max-w:screen-3xs')?.text).toBe('.max-w\\:screen-3xs{max-width:30rem}')
    expect(new MasterCSS().create('max-w:screen-md')?.text).toBe('.max-w\\:screen-md{max-width:64rem}')
    expect(new MasterCSS().create('max-w:16')?.text).toBe('.max-w\\:16{max-width:1rem}')
    expect(new MasterCSS().create('max-w:16px')?.text).toBe('.max-w\\:16px{max-width:16px}')
})