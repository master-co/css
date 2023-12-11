it('validates gap rules', () => {
    expect(new MasterCSS().create('gap-x:16')?.text).toContain('column-gap:1rem')
    expect(new MasterCSS().create('gap-y:16')?.text).toContain('row-gap:1rem')
    expect(new MasterCSS().create('gap:16')?.text).toContain('gap:1rem')
})

it('checks gap order', () => {
    expect(new MasterCSS().add('gap-x:16', 'gap:16', 'gap-y:16').rules)
        .toMatchObject([
            { className: 'gap:16' },
            { className: 'gap-x:16' },
            { className: 'gap-y:16' }
        ])
})