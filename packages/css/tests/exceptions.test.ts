import '../src/polyfills/css-escape'
test('exception handling', async () => {
    const css = new MasterCSS()
    expect(css.generate('master:css').length).toBe(0)
    expect(css.generate('{/if}').length).toBe(0)
    expect(css.generate('fg:blue').length).toBe(1)
})