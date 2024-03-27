it('validates border-radius rules', () => {
    expect(new MasterCSS().create('r:16')?.text).toContain('border-radius:1rem')
    expect(new MasterCSS().create('border-radius:1rem')?.text).toContain('border-radius:1rem')

    expect(new MasterCSS().create('rtl:16')?.text).toContain('border-top-left-radius:1rem')
    expect(new MasterCSS().create('rtr:16')?.text).toContain('border-top-right-radius:1rem')

    expect(new MasterCSS().create('rbl:16')?.text).toContain('border-bottom-left-radius:1rem')
    expect(new MasterCSS().create('rbr:16')?.text).toContain('border-bottom-right-radius:1rem')

    expect(new MasterCSS().create('rt:16')?.text).toContain('border-top-left-radius:1rem;border-top-right-radius:1rem')
    expect(new MasterCSS().create('rb:16')?.text).toContain('border-bottom-left-radius:1rem;border-bottom-right-radius:1rem')
    expect(new MasterCSS().create('rl:16')?.text).toContain('border-top-left-radius:1rem;border-bottom-left-radius:1rem')
    expect(new MasterCSS().create('rr:16')?.text).toContain('border-top-right-radius:1rem;border-bottom-right-radius:1rem')
})

// it('checks border-radius order', () => {
//     expect(new MasterCSS().add('rtr:16', 'r:16', 'rl:16', 'rbr:16').rules)
//         .toMatchObject([
//             { className: 'r:16' },
//             { className: 'rl:16' },
//             { className: 'rbr:16' },
//             { className: 'rtr:16' }
//         ])
// })