test('overflow', () => {
    expect(new MasterCSS().create('overflowed')?.text).toContain('overflow:visible')
    expect(new MasterCSS().create('overflow:hidden')?.text).toContain('overflow:hidden')
    expect(new MasterCSS().create('overflow:overlay')?.text).toContain('overflow:auto;overflow:overlay')
    expect(new MasterCSS().create('overflow-x:overlay')?.text).toContain('overflow-x:auto;overflow-x:overlay')
    expect(new MasterCSS().create('overflow-y:overlay')?.text).toContain('overflow-y:auto;overflow-y:overlay')
    expect(new MasterCSS().create('overflowed:hover')?.text).toBe('.overflowed\\:hover:hover{overflow:visible}')
})
