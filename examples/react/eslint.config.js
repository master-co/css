import js from '@eslint/js'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import css from '@master/eslint-config-css'

export default defineConfig([
    globalIgnores(['dist/**']),
    {
        files: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            ...fixupConfigRules(react.configs.flat.recommended),
            ...fixupConfigRules(react.configs.flat['jsx-runtime'])
        ],
        languageOptions: {
            globals: globals.browser
        },
        plugins: {
            'react-hooks': fixupPluginRules(reactHooks),
            'react-refresh': fixupPluginRules(reactRefresh)
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', {
                allowConstantExport: true
            }]
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    },
    ...css
])
