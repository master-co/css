import MasterCSSCompiler from '../src'

test('read master.css.js config in cwd', async () => {
    const compiler = await new MasterCSSCompiler({ cwd: __dirname }).init()
    expect(compiler.css.config)
        .toBeDefined()
})