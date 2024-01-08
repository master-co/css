test('filter', () => {
    expect(new MasterCSS().create('drop-shadow(0|2|8|black)')?.text).toBe('.drop-shadow\\(0\\|2\\|8\\|black\\){filter:drop-shadow(0rem 0.125rem 0.5rem rgb(0 0 0))}')
    expect(new MasterCSS().create('filter:invert(0.8)')?.text).toBe('.filter\\:invert\\(0\\.8\\){filter:invert(0.8)}')
})
