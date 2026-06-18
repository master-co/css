import { test, expect } from 'vitest'
import { ESLint } from 'eslint'

test('ESLint Configuration is valid', {
    timeout: 15000 // for Mac OS CI test timed out in 5000ms.
}, async () => {
    const eslint = new ESLint({ cwd: __dirname })
    const result = await eslint.lintFiles('./index.html')
    expect(result[0].errorCount).toBe(0)
    expect(result[0].warningCount).toBe(7)
    expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
        [
            'No consistent class order followed.',
            '"m:0.625rem" applies the same declarations as "m:5x" and "m:1.875rem".',
            '"m:5x" applies the same declarations as "m:0.625rem" and "m:1.875rem".',
            '"m:1.875rem" applies the same declarations as "m:0.625rem" and "m:5x".',
            '"m:10x@sm" applies the same declarations as "m:3.125rem@sm".',
            '"m:3.125rem@sm" applies the same declarations as "m:10x@sm".',
            'No consistent class order followed.',
        ]
    )
})
