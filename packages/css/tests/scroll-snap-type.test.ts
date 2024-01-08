test('scroll-snap-type', () => {
    expect(new MasterCSS().create('scroll-snap:x')?.text).toContain('scroll-snap-type:x')
    expect(new MasterCSS().create('scroll-snap-type:x')?.text).toContain('scroll-snap-type:x')
    expect(new MasterCSS().create('scroll-snap-type:x|mandatory')?.text).toContain('scroll-snap-type:x mandatory')
})
