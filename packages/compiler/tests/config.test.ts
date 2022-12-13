import MasterCSSCompiler from '../src'

test('read master.css.js config in cwd', async () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    await compiler.initializing
    expect(compiler.css.config)
        .toBeDefined()
})