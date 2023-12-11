test('transform', () => {
    expect(new MasterCSS().create('translate(16)')?.text).toBe('.translate\\(16\\){transform:translate(1rem)}')
    expect(new MasterCSS().create('translateY(-5):hover')?.text).toBe('.translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
    expect(new MasterCSS().create('transform:translateY(-5):hover')?.text).toBe('.transform\\:translateY\\(-5\\)\\:hover:hover{transform:translateY(-0.3125rem)}')
})

test('transform-box', ()=> {
    expect(new MasterCSS().create('transform:padding')?.text).toContain('transform-box:padding-box')
})