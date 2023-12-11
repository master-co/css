it('checks padding order', () => {
    expect(new MasterCSS().add('px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0').rules)
        .toMatchObject([
            { className: 'p:0' },
            { className: 'px:0' },
            { className: 'py:0' },
            { className: 'pb:0' },
            { className: 'pl:0' },
            { className: 'pr:0' },
            { className: 'pt:0' }
        ])
})

it('validates padding rules', () => {
    expect(new MasterCSS().create('pl:16')?.text).toContain('padding-left:1rem')
    expect(new MasterCSS().create('pr:16')?.text).toContain('padding-right:1rem')
    expect(new MasterCSS().create('pt:16')?.text).toContain('padding-top:1rem')
    expect(new MasterCSS().create('pb:16')?.text).toContain('padding-bottom:1rem')
    expect(new MasterCSS().create('p:16')?.text).toContain('padding:1rem')
    expect(new MasterCSS().create('px:16')?.text).toContain('padding-left:1rem;padding-right:1rem')
    expect(new MasterCSS().create('py:16')?.text).toContain('padding-top:1rem;padding-bottom:1rem')
    expect(new MasterCSS().create('padding-x:16')?.text).toContain('padding-left:1rem;padding-right:1rem')
    expect(new MasterCSS().create('padding-y:16')?.text).toContain('padding-top:1rem;padding-bottom:1rem')
})

test('padding inline', () => {
    expect(new MasterCSS().create('pis:16')?.text).toContain('padding-inline-start:1rem')
    expect(new MasterCSS().create('pie:16')?.text).toContain('padding-inline-end:1rem')
    expect(new MasterCSS().create('pi:16')?.text).toContain('padding-inline:1rem')
})