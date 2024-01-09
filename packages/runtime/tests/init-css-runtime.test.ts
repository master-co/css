import initCSSRuntime from '../src/init-css-runtime'

test('init', async () => {
    const cssRuntime = initCSSRuntime()
    expect(globalThis.cssRuntime).toEqual(cssRuntime)
})