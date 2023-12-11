test('stroke-width', () => {
    expect(new MasterCSS().create('stroke:.75!')?.text).toContain('stroke-width:.75!important')
})

test('stroke-color', () => {
    expect(new MasterCSS().create('stroke:current')?.text).toContain('stroke:currentColor')
    expect(new MasterCSS().create('stroke:red')?.text).toContain('stroke:rgb(209 26 30)')
})