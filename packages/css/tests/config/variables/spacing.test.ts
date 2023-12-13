it('should be able to access custom spacing variables using inherited rules', () => {
    const css = new MasterCSS({
        variables: {
            spacing: {
                md: 20
            }
        }
    })
    expect(css.create('mt:md')?.declarations).toStrictEqual({ 'margin-top': '1.25rem' })
    expect(css.create('p:md')?.declarations).toStrictEqual({ 'padding': '1.25rem' })
})