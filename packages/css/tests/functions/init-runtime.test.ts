import { initRuntime } from '../../src'

test('init', async () => {
    const css = initRuntime()
    expect(globalThis.runtimeCSS).toEqual(css)
})