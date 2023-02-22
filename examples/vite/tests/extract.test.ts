import MasterCSSCompiler from '@master/css-compiler'

it('extract class names from entry HTML file ( like index.html, app.html )', async () => {
    const compiler = await new MasterCSSCompiler({ include: ['index.html'] }).compile()

    const result = Object.keys(compiler.css.ruleOfClass).join(' ')
    for (const className of [
        'flex',
        'center-content',
        '172x172',
        'font:sans',
        'ls:.25',
        'fg:white'
    ]) {
        expect(result).toContain(className)
    }
})

it('extract class names from framework component file', async () => {
    const compiler = await new MasterCSSCompiler({ include: ['./src/main.ts'] }).compile()

    const result = Object.keys(compiler.css.ruleOfClass).join(' ')
    for (const className of [
        '~transform|.3s',
        'translateY(-5):hover'
    ]) {
        expect(result).toContain(className)
    }
})