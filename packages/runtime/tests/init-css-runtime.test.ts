import initCSSRuntime from '../src/init-css-runtime'

test('init', async () => {
    const runtimeCSS = initCSSRuntime()
    expect(globalThis.runtimeCSS).toEqual(runtimeCSS)
})