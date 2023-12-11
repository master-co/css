test('text-overflow', () => {
    expect(new MasterCSS().create('text:clip')?.text).toContain('text-overflow:clip')
    expect(new MasterCSS().create('text-overflow:clip')?.text).toContain('text-overflow:clip')

    expect(new MasterCSS().create('text:ellipsis')?.text).toContain('text-overflow:ellipsis')
    expect(new MasterCSS().create('text-overflow:ellipsis')?.text).toContain('text-overflow:ellipsis')
})