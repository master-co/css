import { ESLint } from 'eslint'

test('ESLint Configuration is valid', async () => {
    const eslint = new ESLint({ cwd: __dirname })
    const result = await eslint.lintFiles('./index.html')
    expect(result[0].errorCount).toBe(1)
    expect(result[0].warningCount).toBe(6)
    expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
        [
            "\"m:10\" applies the same CSS declarations as \"m:20\" and \"m:30\".",
            "\"m:20\" applies the same CSS declarations as \"m:10\" and \"m:30\".",
            "\"m:30\" applies the same CSS declarations as \"m:10\" and \"m:20\".",
            "\"m:40@sm\" applies the same CSS declarations as \"m:50@sm\".",
            "\"m:50@sm\" applies the same CSS declarations as \"m:40@sm\".",
            "No consistent class order followed.",
            "Invalid value for `width` property.",
        ]
    )
})