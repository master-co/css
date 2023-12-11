it('validates border-width rules', () => {
    expect(new MasterCSS().create('b:16')?.text).toContain('border-width:1rem')
    expect(new MasterCSS().create('border:16')?.text).toContain('border-width:1rem')
    expect(new MasterCSS().create('border-width:16')?.text).toContain('border-width:1rem')

    expect(new MasterCSS().create('bb:16')?.text).toContain('border-bottom-width:1rem')
    expect(new MasterCSS().create('border-bottom:16')?.text).toContain('border-bottom-width:1rem')
    expect(new MasterCSS().create('border-bottom-width:16')?.text).toContain('border-bottom-width:1rem')

    expect(new MasterCSS().create('bt:16')?.text).toContain('border-top-width:1rem')
    expect(new MasterCSS().create('border-top:16')?.text).toContain('border-top-width:1rem')
    expect(new MasterCSS().create('border-top-width:16')?.text).toContain('border-top-width:1rem')

    expect(new MasterCSS().create('bl:16')?.text).toContain('border-left-width:1rem')
    expect(new MasterCSS().create('border-left:16')?.text).toContain('border-left-width:1rem')
    expect(new MasterCSS().create('border-left-width:16')?.text).toContain('border-left-width:1rem')

    expect(new MasterCSS().create('br:16')?.text).toContain('border-right-width:1rem')
    expect(new MasterCSS().create('border-right:16')?.text).toContain('border-right-width:1rem')
    expect(new MasterCSS().create('border-right-width:16')?.text).toContain('border-right-width:1rem')

    expect(new MasterCSS().create('bx:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(new MasterCSS().create('border-x:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')
    expect(new MasterCSS().create('border-x-width:16')?.text).toContain('border-left-width:1rem;border-right-width:1rem')

    expect(new MasterCSS().create('border:16|solid')?.text).toContain('border:1rem solid')
})

it('checks border-width order', () => {
    expect(new MasterCSS().add('bt:16', 'b:16', 'bl:16', 'bx:16').rules)
        .toMatchObject([
            { className: 'b:16' },
            { className: 'bx:16' },
            { className: 'bl:16' },
            { className: 'bt:16' }
        ])
})