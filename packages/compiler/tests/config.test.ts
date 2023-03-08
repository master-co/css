import MasterCSSCompiler from '../src'

test('read master.css.js config in cwd', async () => {
    const compiler = await new MasterCSSCompiler({ cwd: __dirname })
    expect(compiler.css.config)
        .toBeDefined()
})

test('master.css.js config custom classname', async () => {
    const compiler = new MasterCSSCompiler({ cwd: __dirname })
    expect(
        compiler.extract('test.tsx',
        `
            <h1 className={'rel ' + styles.title}>
            <h1 className="{styles.title + ' ' + 'blue-btn'}">
            <button className="test btn">
        `)
    ).toEqual(['rel', 'blue-btn', 'btn'])
})
