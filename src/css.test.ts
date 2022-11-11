import MasterCSS from '.'

test('css', async () => {
    const p1 = document.createElement('p')
    p1.className = 'block'
    document.body.append(p1)
    const css = new MasterCSS()
    p1.classList.add('italic')
    p1.remove()
    expect(css.countOfClass).toEqual({})
})