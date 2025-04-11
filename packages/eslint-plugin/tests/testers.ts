import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const configs = {
    jsx: {
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                }
            }
        }
    }
} satisfies Record<string, RuleTesterConfig>

export const jsxTester = new RuleTester(configs.jsx)

export const createTester = (config: RuleTesterConfig, lang: keyof typeof configs = 'jsx') => {
    return new RuleTester({
        ...configs[lang],
        ...config
    })
}

export const source = (name: string, base: string) => {
    const filename = fileURLToPath(new URL(name, base))
    return {
        name: filename,
        filename,
        code: readFileSync(filename, 'utf-8'),
    }
}