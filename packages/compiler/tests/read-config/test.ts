import { MasterCSSCompiler } from '../../src'

test('read config', async () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.readConfig())
        .toEqual({
            classes: {}
        })
})