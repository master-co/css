import initCSSRuntime from '../src/init-css-runtime'

test('progressive', () => {
    const style = document.createElement('style')
    style.id = 'master'
    document.head.append(style)

    const runtimeCSS = initCSSRuntime()
    runtimeCSS.destroy()
    expect(document.head.contains(style)).toBeTruthy()
})
