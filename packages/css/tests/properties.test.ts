it('native properties', ()=> {
    expect(new MasterCSS().create('y:1')?.text).toContain('y:1')
    expect(new MasterCSS().create('x:1')?.text).toContain('x:1')
    expect(new MasterCSS().create('cy:1')?.text).toContain('cy:1')
    expect(new MasterCSS().create('cx:1')?.text).toContain('cx:1')
})