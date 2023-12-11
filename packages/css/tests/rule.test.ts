test('states', () => {
    const css = new MasterCSS()
    expect(css.generate('font:12:hover[disabled]@sm')[0].stateToken).toBe(':hover[disabled]@sm')
})