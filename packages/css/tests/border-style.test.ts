it('validates border-style rules', () => {
    expect(new MasterCSS().create('b:solid')?.text).toContain('border-style:solid')
    expect(new MasterCSS().create('border:solid')?.text).toContain('border-style:solid')
    expect(new MasterCSS().create('border-style:solid')?.text).toContain('border-style:solid')

    expect(new MasterCSS().create('bb:solid')?.text).toContain('border-bottom-style:solid')
    expect(new MasterCSS().create('border-bottom:solid')?.text).toContain('border-bottom-style:solid')
    expect(new MasterCSS().create('border-bottom-style:solid')?.text).toContain('border-bottom-style:solid')

    expect(new MasterCSS().create('bt:solid')?.text).toContain('border-top-style:solid')
    expect(new MasterCSS().create('border-top:solid')?.text).toContain('border-top-style:solid')
    expect(new MasterCSS().create('border-top-style:solid')?.text).toContain('border-top-style:solid')

    expect(new MasterCSS().create('bl:solid')?.text).toContain('border-left-style:solid')
    expect(new MasterCSS().create('border-left:solid')?.text).toContain('border-left-style:solid')
    expect(new MasterCSS().create('border-left-style:solid')?.text).toContain('border-left-style:solid')

    expect(new MasterCSS().create('br:solid')?.text).toContain('border-right-style:solid')
    expect(new MasterCSS().create('border-right:solid')?.text).toContain('border-right-style:solid')
    expect(new MasterCSS().create('border-right-style:solid')?.text).toContain('border-right-style:solid')

    expect(new MasterCSS().create('bx:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(new MasterCSS().create('border-x:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')
    expect(new MasterCSS().create('border-x-style:solid')?.text).toContain('border-left-style:solid;border-right-style:solid')

    expect(new MasterCSS().create('border:solid|1')?.text).toContain('border:solid 0.0625rem')
})

it('checks border-style order', () => {
    expect(new MasterCSS().add('bt:solid', 'b:solid', 'bl:dotted', 'bx:solid').rules)
        .toMatchObject([
            { className: 'b:solid' },
            { className: 'bx:solid' },
            { className: 'bl:dotted' },
            { className: 'bt:solid' }
        ])
})