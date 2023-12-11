it('animation-fill-mode', () => {
    expect(new MasterCSS().create('animation-fill-mode:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })
    expect(new MasterCSS().create('@fill:forwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'forwards' })

    expect(new MasterCSS().create('animation-fill-mode:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })
    expect(new MasterCSS().create('@fill:backwards')?.declarations).toStrictEqual({ 'animation-fill-mode': 'backwards' })

    expect(new MasterCSS().create('animation-fill-mode:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })
    expect(new MasterCSS().create('@fill:both')?.declarations).toStrictEqual({ 'animation-fill-mode': 'both' })

    expect(new MasterCSS().create('animation-fill-mode:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })
    expect(new MasterCSS().create('@fill:none')?.declarations).toStrictEqual({ 'animation-fill-mode': 'none' })

    expect(new MasterCSS().create('animation-fill-mode:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })
    expect(new MasterCSS().create('@fill:revert')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert' })

    expect(new MasterCSS().create('animation-fill-mode:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
    expect(new MasterCSS().create('@fill:revert-layer')?.declarations).toStrictEqual({ 'animation-fill-mode': 'revert-layer' })
})