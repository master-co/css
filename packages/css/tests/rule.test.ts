import MasterCSS from '../src'

test('states', () => {
    const css = new MasterCSS()
    expect(css.create('font:12:hover[disabled]@sm')[0].stateToken).toBe(':hover[disabled]@sm')
})