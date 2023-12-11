const config = {
    variables: {
        spacing: { x1: 16 }
    }
}

test('spacing', () => {
    expect(new MasterCSS(config).create('m:x1')?.text).toContain('margin:1rem')
    expect(new MasterCSS(config).create('mt:x1')?.text).toContain('margin-top:1rem')
    expect(new MasterCSS(config).create('scroll-mt:x1')?.text).toContain('scroll-margin-top:1rem')
    expect(new MasterCSS(config).create('p:x1')?.text).toContain('padding:1rem')
    expect(new MasterCSS(config).create('pt:x1')?.text).toContain('padding-top:1rem')
    expect(new MasterCSS(config).create('cx:x1')?.text).toContain('cx:16')
    expect(new MasterCSS(config).create('y:x1')?.text).toContain('y:16')
    expect(new MasterCSS(config).create('outline-offset:x1')?.text).toContain('outline-offset:1rem')
})