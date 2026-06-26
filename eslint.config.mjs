import eslintConfigTechor from 'eslint-config-techor'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))

export default [
    includeIgnoreFile(gitignorePath),
    eslintConfigTechor.configs.base,
    eslintConfigTechor.configs.typescript,
    eslintConfigTechor.configs.stylistic,
    {
        rules: {
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/prefer-for-of': 'off'
        }
    },
    {
        files: ['**/*.{ts,tsx,mts,cts}'],
        rules: {
            quotes: 'off'
        }
    }
]
