import { initRuntime } from '../../src'

test('init', async () => {
    const css = initRuntime()
    expect(window.masterCSS).toEqual(css)
})