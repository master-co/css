import { MasterCSSCompiler } from '../../src'

test('read options (ts)', async () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.readOptions())
        .toEqual({
            module: 'virtual:master.css',
        })
})