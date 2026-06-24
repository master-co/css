import { ESLint, type Linter } from 'eslint'
import { expect, test } from 'vitest'
import plugin from '../src'
import { masterCSSSettingsSchema } from '../src/settings-schema'

const baseConfig: Linter.Config = {
    files: ['**/*.jsx'],
    plugins: {
        '@master/css': plugin
    },
    languageOptions: {
        parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true
            }
        }
    }
}

function createESLint(rules: Linter.RulesRecord) {
    return new ESLint({
        overrideConfigFile: true,
        overrideConfig: [{
            ...baseConfig,
            rules
        }]
    })
}

test('keeps Master CSS settings schema separate from rule option schemas', () => {
    expect(masterCSSSettingsSchema).toMatchObject({
        type: 'object',
        additionalProperties: false,
        properties: {
            classAttributes: expect.any(Object),
            classFunctions: expect.any(Object),
            classDeclarations: expect.any(Object),
            ignoredKeys: expect.any(Object),
            manifest: expect.any(Object)
        }
    })
})

test('accepts no-invalid-classes rule options explicitly', async () => {
    const [result] = await createESLint({
        '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }]
    }).lintText(`<div className="unknown-class" />`, { filePath: 'index.jsx' })

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].ruleId).toBe('@master/css/no-invalid-classes')
})

test('rejects unknown no-invalid-classes rule options', async () => {
    await expect(createESLint({
        '@master/css/no-invalid-classes': ['error', { classAttributes: ['className'] }]
    }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
        .rejects.toThrow()
})

test('rejects rule options for rules configured through settings only', async () => {
    await expect(createESLint({
        '@master/css/sort-classes': ['error', { classAttributes: ['className'] }]
    }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
        .rejects.toThrow()

    await expect(createESLint({
        '@master/css/no-conflicting-classes': ['error', { classFunctions: ['ctl'] }]
    }).lintText(`<div className="block" />`, { filePath: 'index.jsx' }))
        .rejects.toThrow()
})
