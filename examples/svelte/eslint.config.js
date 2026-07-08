import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import svelte from 'eslint-plugin-svelte'
import globals from 'globals'
import ts from 'typescript-eslint'
import css from '@master/eslint-config-css'

export default defineConfig([
  globalIgnores(['.svelte-kit/**', '.vercel/**', 'build/**']),
  {
    files: ['**/*.{js,cjs,mjs,ts,cts,mts,svelte}'],
    extends: [
      js.configs.recommended,
      ts.configs.recommended,
      ...svelte.configs['flat/recommended']
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser
      }
    },
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
      'svelte/prefer-writable-derived': 'off',
      'svelte/require-each-key': 'off'
    }
  },
  ...css
])
