import { test, expect } from 'vitest'
import { ESLint } from 'eslint'
import css from '../src/index'

test('ESLint Configuration is valid', async () => {
    const eslint = new ESLint({ cwd: __dirname })
    const result = await eslint.lintFiles('./index.html')
    expect(result[0].errorCount).toBe(0)
    expect(result[0].warningCount).toBe(9)
    expect(result[0].messages.map((eachMessage) => eachMessage.message)).toEqual(
        [
            'No consistent class order followed.',
            '"m:0.625rem", "m:5x", and "m:10x@sm" are overridden by "m:1.875rem" and "m:3.125rem@sm".',
            'No consistent class order followed.',
            'Prefer "font:xs" over "font:.75rem".',
            'Prefer "font:2xl@sm" over "font:1.5rem@sm".',
            'Prefer "mx:8x mt:8x" over "m:8x" because "mb:12x" overrides part of it.',
            'Prefer "m:xl" over "m:8x".',
            'Prefer "font:3xl@md" over "font:2rem@md".',
            'Prefer "mb:2xl" over "mb:12x".',
        ]
    )
})

test('Default ESLint configuration lints standalone stylesheets', async () => {
    const diagnosticESLint = new ESLint({
        cwd: __dirname,
        overrideConfigFile: true,
        overrideConfig: css
    })
    const fixESLint = new ESLint({
        cwd: __dirname,
        fix: true,
        overrideConfigFile: true,
        overrideConfig: css
    })
    const [diagnosticResult] = await diagnosticESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })
    const [fixResult] = await fixESLint.lintText('.btn { @compose contain:content; }', { filePath: 'index.css' })

    expect(diagnosticResult.errorCount).toBe(0)
    expect(diagnosticResult.warningCount).toBe(1)
    expect(fixResult.output).toBe('.btn { contain: content; }')
})
