test('content', () => {
    // expect(new MasterCSS().create('content:\'foo\'')?.text).toBe('.content\\:\\\'foo\\\'{content:\'foo\'}')
    expect(new MasterCSS().create('content:\'fo\\\'o\'')?.text).toContain('content:\'fo\\\'o\'')
})
