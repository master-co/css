import MasterCSSCompiler from '../../src'

test('Oskar', async () => {
    const compiler = await new MasterCSSCompiler({ cwd: __dirname }).compile()
    expect(
        compiler.extract('test.tsx',
            `
            <div class="hidden flex@sm">
            <div class="display:hidden p:15 flex@sm  gap:5  ">
            <div class="scale(.5)@sm">
        `)
    ).toStrictEqual([
        'hidden',
        'flex@sm',
        'display:hidden',
        'p:15',
        'gap:5',
        'scale(.5)@sm',
    ])
})
