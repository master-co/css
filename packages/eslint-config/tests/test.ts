import { test, expect } from 'vitest'
import { ESLint } from 'eslint'

test('ESLint Configuration is valid', async () => {
    const eslint = new ESLint({ cwd: __dirname })
    const result = await eslint.lintFiles('./index.html')
    expect(result[0].errorCount).toBe(0)
    expect(result[0].warningCount).toBe(8)
    expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
        [
            'No consistent class order followed.',
            '"m:0.625rem", "m:5x", and "m:10x@sm" are overridden by "m:1.875rem" and "m:3.125rem@sm".',
            'No consistent class order followed.',
            'Prefer "font:xs" over "font:.75rem".',
            'Prefer "font:2xl@sm" over "font:1.5rem@sm".',
            'Prefer "m:xl" over "m:8x".',
            'Prefer "font:3xl@md" over "font:2rem@md".',
            'Prefer "mb:2xl" over "mb:12x".',
        ]
    )
})
