it('checks margin order', () => {
    expect(new MasterCSS().add('mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0').rules)
        .toMatchObject([
            { className: 'm:0' },
            { className: 'mx:0' },
            { className: 'my:0' },
            { className: 'mb:0' },
            { className: 'ml:0' },
            { className: 'mr:0' },
            { className: 'mt:0' }
        ])
})

test('margin', () => {
    expect(new MasterCSS().create('ml:16')?.text).toContain('margin-left:1rem')
    expect(new MasterCSS().create('mr:16')?.text).toContain('margin-right:1rem')
    expect(new MasterCSS().create('mt:16')?.text).toContain('margin-top:1rem')
    expect(new MasterCSS().create('mb:16')?.text).toContain('margin-bottom:1rem')
    expect(new MasterCSS().create('m:16')?.text).toContain('margin:1rem')
    expect(new MasterCSS().create('mx:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(new MasterCSS().create('my:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
    expect(new MasterCSS().create('margin-x:16')?.text).toContain('margin-left:1rem;margin-right:1rem')
    expect(new MasterCSS().create('margin-y:16')?.text).toContain('margin-top:1rem;margin-bottom:1rem')
})

test('margin inline', () => {
    expect(new MasterCSS().create('mis:16')?.text).toContain('margin-inline-start:1rem')
    expect(new MasterCSS().create('mie:16')?.text).toContain('margin-inline-end:1rem')
    expect(new MasterCSS().create('mi:16')?.text).toContain('margin-inline:1rem')
})