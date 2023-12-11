test('variable', () => {
    expect(new MasterCSS({ variables: { placement: 'center' } }).create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:center}')
})

it('falls back to native if not found', () => {
    expect(new MasterCSS().create('text-align:$(placement)')?.text).toBe('.text-align\\:\\$\\(placement\\){text-align:var(--placement)}')
})