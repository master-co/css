test('outline', () => {
    expect(new MasterCSS().create('outline:current')?.text).toContain('outline-color:currentColor')
    expect(new MasterCSS().create('outline:transparent')?.text).toContain('outline-color:transparent')
    expect(new MasterCSS().create('outline:black')?.text).toContain('outline-color:rgb(0 0 0)')
    expect(new MasterCSS().create('outline:2|black')?.text).toContain('outline:0.125rem rgb(0 0 0) solid')
    expect(new MasterCSS().create('outline:1')?.text).toContain('outline-width:0.0625rem')
    expect(new MasterCSS().create('outline:dashed|black')?.text).toContain('outline:dashed rgb(0 0 0)')
    expect(new MasterCSS().create('outline:solid')?.text).toContain('outline-style:solid')
    expect(new MasterCSS().create('outline:1rem|solid')?.text).toContain('outline:1rem solid')
    expect(new MasterCSS().create('outline:thick|double|black')?.text).toContain('outline:thick double rgb(0 0 0)')
    expect(new MasterCSS().create('outline:none')?.text).toContain('outline-style:none')
    expect(new MasterCSS().create('outline:auto')?.text).toContain('outline-style:auto')
    expect(new MasterCSS().create('outline:unset')?.text).toContain('outline:unset')
    expect(new MasterCSS().create('outline:inherit')?.text).toContain('outline:inherit')
    expect(new MasterCSS().create('outline:initial')?.text).toContain('outline:initial')
    expect(new MasterCSS().create('outline:revert')?.text).toContain('outline:revert')
    expect(new MasterCSS().create('outline:revert-layer')?.text).toContain('outline:revert-layer')
    expect(new MasterCSS().create('outline:auto|1')?.text).toContain('outline:auto 0.0625rem')
})

test('autofill solid', () => {
    expect(new MasterCSS().create('outline:16|black')?.text).toContain('outline:1rem rgb(0 0 0) solid')
    expect(new MasterCSS().create('outline:16|black|solid')?.text).toContain('outline:1rem rgb(0 0 0) solid')
    expect(new MasterCSS({ variables: { line: 'solid' } }).create('outline:16|black|line')?.text).toContain('outline:1rem rgb(0 0 0) solid')
    expect(new MasterCSS({
        variables: {
            line: { '@light': 'solid', '@dark': 'dotted' }
        }
    }).add('outline:16|line').text).toBe(
        '.light{--line:solid}' +
        '.dark{--line:dotted}' +
        '.outline\\:16\\|line{outline:1rem var(--line) solid}'
    )
})