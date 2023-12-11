it('animation-play-state', () => {
    expect(new MasterCSS().create('animation-play-state:running')?.declarations).toStrictEqual({ 'animation-play-state': 'running' })
    expect(new MasterCSS().create('@play:running')?.declarations).toStrictEqual({ 'animation-play-state': 'running' })

    expect(new MasterCSS().create('animation-play-state:paused')?.declarations).toStrictEqual({ 'animation-play-state': 'paused' })
    expect(new MasterCSS().create('@play:paused')?.declarations).toStrictEqual({ 'animation-play-state': 'paused' })
})