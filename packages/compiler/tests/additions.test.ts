import MasterCSSCompiler from '../src'

test('additions', () => {
    const compiler = new MasterCSSCompiler({
        additions: ['./tests/test.html']
    })
    expect(compiler.css.text)
        .toBeNull()
})