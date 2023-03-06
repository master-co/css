import '../src/polyfills/css-escape'
import MasterCSS from '../src'

test('exception handling', async () => {
    const css = new MasterCSS()
    expect(css.create('master:css').length).toBe(0)
    expect(css.create('{/if}').length).toBe(0)
    expect(css.create('fg:blue').length).toBe(1)
})