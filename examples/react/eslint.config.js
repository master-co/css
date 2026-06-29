import js from '@eslint/js'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url';
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import css from '@master/eslint-config-css'

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))

export default tseslint.config(
    includeIgnoreFile(gitignorePath),
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react': react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
        },
    },
    ...css
)
