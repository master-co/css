import MasterCSSCompiler from '../src'

test('read master.css.js config in cwd', () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.css.config)
        .toBeDefined()
})