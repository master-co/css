test('border', () => {
    expect(new MasterCSS().create('border:current')?.text).toContain('border-color:currentColor')
    expect(new MasterCSS().create('border:transparent')?.text).toContain('border-color:transparent')
    expect(new MasterCSS().create('border:black')?.text).toContain('border-color:rgb(0 0 0)')
    expect(new MasterCSS().create('border:2|black')?.text).toContain('border:0.125rem rgb(0 0 0) solid')
    expect(new MasterCSS().create('border:1')?.text).toContain('border-width:0.0625rem')
    expect(new MasterCSS().create('border:dashed|black')?.text).toContain('border:dashed rgb(0 0 0)')
    expect(new MasterCSS().create('border:solid')?.text).toContain('border-style:solid')
    expect(new MasterCSS().create('border:1rem|solid')?.text).toContain('border:1rem solid')
    expect(new MasterCSS().create('border:thick|double|black')?.text).toContain('border:thick double rgb(0 0 0)')
    expect(new MasterCSS().create('border:none')?.text).toContain('border-style:none')
    expect(new MasterCSS().create('border:auto')?.text).toContain('border-style:auto')
    expect(new MasterCSS().create('border:unset')?.text).toContain('border:unset')
    expect(new MasterCSS().create('border:inherit')?.text).toContain('border:inherit')
    expect(new MasterCSS().create('border:initial')?.text).toContain('border:initial')
    expect(new MasterCSS().create('border:revert')?.text).toContain('border:revert')
    expect(new MasterCSS().create('border:revert-layer')?.text).toContain('border:revert-layer')
    expect(new MasterCSS().create('border:auto|1')?.text).toContain('border:auto 0.0625rem')
})

it('validates border rules', () => {
    expect(new MasterCSS().create('b:16|solid')?.text).toContain('border:1rem solid')
    expect(new MasterCSS().create('border:16|solid')?.text).toContain('border:1rem solid')

    expect(new MasterCSS().create('bt:16|solid')?.text).toContain('border-top:1rem solid')
    expect(new MasterCSS().create('border-top:16|solid')?.text).toContain('border-top:1rem solid')

    expect(new MasterCSS().create('bb:16|solid')?.text).toContain('border-bottom:1rem solid')
    expect(new MasterCSS().create('border-bottom:16|solid')?.text).toContain('border-bottom:1rem solid')

    expect(new MasterCSS().create('bl:16|solid')?.text).toContain('border-left:1rem solid')
    expect(new MasterCSS().create('border-left:16|solid')?.text).toContain('border-left:1rem solid')

    expect(new MasterCSS().create('br:16|solid')?.text).toContain('border-right:1rem solid')
    expect(new MasterCSS().create('border-right:16|solid')?.text).toContain('border-right:1rem solid')

    expect(new MasterCSS().create('bx:16|solid')?.text).toContain('border-left:1rem solid;border-right:1rem solid')
    expect(new MasterCSS().create('border-x:16|solid')?.text).toContain('border-left:1rem solid;border-right:1rem solid')

    expect(new MasterCSS().create('by:16|solid')?.text).toContain('border-top:1rem solid;border-bottom:1rem solid')
    expect(new MasterCSS().create('border-y:16|solid')?.text).toContain('border-top:1rem solid;border-bottom:1rem solid')

    expect(new MasterCSS().create('br:1px|solid|black')?.text).toContain('border-right:1px solid rgb(0 0 0)')

    expect(new MasterCSS().create('br:1px|black')?.text).toContain('border-right:1px rgb(0 0 0) solid')
})

it('checks border order', () => {
    expect(new MasterCSS().add('bt:1|solid', 'b:1|solid', 'br:1|solid').rules)
        .toMatchObject([
            { className: 'b:1|solid' },
            { className: 'br:1|solid' },
            { className: 'bt:1|solid' }
        ])
})

test('autofill solid', () => {
    expect(new MasterCSS().create('border:16|black')?.text).toContain('border:1rem rgb(0 0 0) solid')
    expect(new MasterCSS().create('border:16|black|solid')?.text).toContain('border:1rem rgb(0 0 0) solid')
    expect(new MasterCSS({ variables: { line: 'solid' } }).create('border:16|black|line')?.text).toContain('border:1rem rgb(0 0 0) solid')
    expect(new MasterCSS({
        variables: {
            line: { '@light': 'solid', '@dark': 'dotted' }
        }
    }).add('border:16|line').text).toBe(
        '.light{--line:solid}' +
        '.dark{--line:dotted}' +
        '.border\\:16\\|line{border:1rem var(--line) solid}'
    )
    expect(new MasterCSS({
        variables: {
            primary: { '@light': '#000000', '@dark': '#ffffff' }
        }
    }).add('border:16|primary').text).toBe(
        '.light{--primary:0 0 0}' +
        '.dark{--primary:255 255 255}' +
        '.border\\:16\\|primary{border:1rem rgb(var(--primary)) solid}'
    )
})