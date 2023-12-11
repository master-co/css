it('flex', () => {
    expect(new MasterCSS().create('flex:1|1|auto')?.text).toBe('.flex\\:1\\|1\\|auto{flex:1 1 auto}')
    // expect(new MasterCSS().create('flex:hover')?.text).toBe('.flex\\:hover{flex: hover}')
})
