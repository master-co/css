it('validates border-color rules', () => {
    expect(new MasterCSS().create('b:white')?.text).toContain('border-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border:white')?.text).toContain('border-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-color:white')?.text).toContain('border-color:rgb(255 255 255)')

    expect(new MasterCSS().create('bb:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-bottom:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-bottom-color:white')?.text).toContain('border-bottom-color:rgb(255 255 255)')

    expect(new MasterCSS().create('bt:white')?.text).toContain('border-top-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-top:white')?.text).toContain('border-top-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-top-color:white')?.text).toContain('border-top-color:rgb(255 255 255)')

    expect(new MasterCSS().create('bl:white')?.text).toContain('border-left-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-left:white')?.text).toContain('border-left-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-left-color:white')?.text).toContain('border-left-color:rgb(255 255 255)')

    expect(new MasterCSS().create('br:white')?.text).toContain('border-right-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-right:white')?.text).toContain('border-right-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-right-color:white')?.text).toContain('border-right-color:rgb(255 255 255)')

    expect(new MasterCSS().create('bx:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-x:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')
    expect(new MasterCSS().create('border-x-color:white')?.text).toContain('border-left-color:rgb(255 255 255);border-right-color:rgb(255 255 255)')

    expect(new MasterCSS().create('border:white|solid')?.text).toContain('border:rgb(255 255 255) solid')
})

it('checks border-color order', () => {
    expect(new MasterCSS().add('bt:white', 'b:white', 'bl:white', 'bx:white').rules)
        .toMatchObject([
            { className: 'b:white' },
            { className: 'bx:white' },
            { className: 'bl:white' },
            { className: 'bt:white' }
        ])
})