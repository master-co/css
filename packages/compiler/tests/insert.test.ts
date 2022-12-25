import MasterCSSCompiler from '../src/compiler'

it('fairly irregular extracts can be ignored very well', async () => {
    const compiler = await new MasterCSSCompiler({}).init()
    const rules = await compiler.createRules('shadow:rgba(45,43,37,0.05)|0|-1|0|0|inset,rgba(15,14,12,')
    expect(rules.length).toEqual(0)
})