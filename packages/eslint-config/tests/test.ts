import { ESLint } from 'eslint'

test('ESLint Configuration is valid', async () => {
    const eslint = new ESLint({ cwd: __dirname })
    const result = await eslint.lintFiles('./index.html')
    expect(result[0].errorCount).toBe(1)
    expect(result[0].warningCount).toBe(7)
})