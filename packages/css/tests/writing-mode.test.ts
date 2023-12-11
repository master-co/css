test('writing', () => {
    expect(new MasterCSS().create('writing:rl')?.text).toContain('writing-mode:rl')
})
