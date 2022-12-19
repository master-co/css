import MasterCSSCompiler from '../src'

it('check the excluded files', async () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.sources).not.toContain('master.css.js')
})

it('should contain the specific source', async () => {
    const compiler = new MasterCSSCompiler({
        sources: ['master.css.js'], // master.css.js is excluded by default `options.exclude`
        cwd: __dirname
    })
    expect(compiler.sources).toContain('master.css.js')
})