test('font-weight', () => {
    expect(new MasterCSS().create('font:bolder')?.text).toBe('.font\\:bolder{font-weight:bolder}')
    expect(new MasterCSS().create('font:thin')?.text).toBe('.font\\:thin{font-weight:100}')
})
