test('font-feature-settings', () => {
    expect(new MasterCSS().create('font-feature:\'cv02\',\'cv03\',\'cv04\',\'cv11\'')?.text).toBe('.font-feature\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
})
