import CSSExtractor from '../src'

it('check the excluded files', async () => {
    const extractor = new CSSExtractor({ cwd: __dirname })
    expect(extractor.fixedSourcePaths).not.toContain('master.css.js')
})

it('should contain the specific source', async () => {
    const extractor = new CSSExtractor({
        sources: ['master.css.js'], // master.css.js is excluded by default `options.exclude`
        cwd: __dirname
    })
    expect(extractor.fixedSourcePaths).toContain('master.css.js')
})