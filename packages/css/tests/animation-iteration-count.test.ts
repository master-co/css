it('animation-iteration-count', () => {
    expect(new MasterCSS().create('animation-iteration-count:infinite')?.declarations).toStrictEqual({ 'animation-iteration-count': 'infinite' })
    expect(new MasterCSS().create('@iteration:infinite')?.declarations).toStrictEqual({ 'animation-iteration-count': 'infinite' })

    expect(new MasterCSS().create('animation-iteration-count:1')?.declarations).toStrictEqual({ 'animation-iteration-count': '1' })
    expect(new MasterCSS().create('@iteration:1')?.declarations).toStrictEqual({ 'animation-iteration-count': '1' })
})