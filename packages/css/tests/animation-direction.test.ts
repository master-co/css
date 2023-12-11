it('animation-direction', () => {
    expect(new MasterCSS().create('animation-direction:normal')?.declarations).toStrictEqual({ 'animation-direction': 'normal' })
    expect(new MasterCSS().create('@direction:normal')?.declarations).toStrictEqual({ 'animation-direction': 'normal' })

    expect(new MasterCSS().create('animation-direction:reverse')?.declarations).toStrictEqual({ 'animation-direction': 'reverse' })
    expect(new MasterCSS().create('@direction:reverse')?.declarations).toStrictEqual({ 'animation-direction': 'reverse' })

    expect(new MasterCSS().create('animation-direction:alternate')?.declarations).toStrictEqual({ 'animation-direction': 'alternate' })
    expect(new MasterCSS().create('@direction:alt')?.declarations).toStrictEqual({ 'animation-direction': 'alternate' })

    expect(new MasterCSS().create('animation-direction:alternate-reverse')?.declarations).toStrictEqual({ 'animation-direction': 'alternate-reverse' })
    expect(new MasterCSS().create('@direction:alt-reverse')?.declarations).toStrictEqual({ 'animation-direction': 'alternate-reverse' })
})