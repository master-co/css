it('checks scroll-margin order', () => {
    expect(new MasterCSS().add('scroll-mx:0', 'scroll-ml:0', 'scroll-mr:0', 'scroll-m:0', 'scroll-mt:0', 'scroll-mb:0', 'scroll-my:0').rules)
        .toMatchObject([
            { className: 'scroll-m:0' },
            { className: 'scroll-mx:0' },
            { className: 'scroll-my:0' },
            { className: 'scroll-mb:0' },
            { className: 'scroll-ml:0' },
            { className: 'scroll-mr:0' },
            { className: 'scroll-mt:0' }
        ])
})

it('validates scroll-margin rules', () => {
    expect(new MasterCSS().create('scroll-ml:16')?.text).toContain('scroll-margin-left:1rem')
    expect(new MasterCSS().create('scroll-mr:16')?.text).toContain('scroll-margin-right:1rem')
    expect(new MasterCSS().create('scroll-mt:16')?.text).toContain('scroll-margin-top:1rem')
    expect(new MasterCSS().create('scroll-mb:16')?.text).toContain('scroll-margin-bottom:1rem')
    expect(new MasterCSS().create('scroll-m:16')?.text).toContain('scroll-margin:1rem')
    expect(new MasterCSS().create('scroll-mx:16')?.text).toContain('scroll-margin-left:1rem;scroll-margin-right:1rem')
    expect(new MasterCSS().create('scroll-my:16')?.text).toContain('scroll-margin-top:1rem;scroll-margin-bottom:1rem')
    expect(new MasterCSS().create('scroll-margin-x:16')?.text).toContain('scroll-margin-left:1rem;scroll-margin-right:1rem')
    expect(new MasterCSS().create('scroll-margin-y:16')?.text).toContain('scroll-margin-top:1rem;scroll-margin-bottom:1rem')
})