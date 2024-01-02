test('states', () => {
    const css = new MasterCSS()
    expect(css.generate('font:12:hover[disabled]@sm')[0].stateToken).toBe(':hover[disabled]@sm')
})

test('theme declarations', () => {
    const css = new MasterCSS({
        variables: {
            primary: {
                '@light': '#fff',
                '@dark': '#000'
            }
        }
    })
    expect(css.generate('fg:primary')[0].declarations).toEqual({ color: 'rgb(var(--primary))' })
})