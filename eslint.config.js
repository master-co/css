import js from '@eslint/js'
import { fixupPluginRules, includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url))
const sourceFiles = ['**/*.{js,cjs,ts,cts,mts,jsx,tsx,mtsx}']
const typeScriptFiles = ['**/*.{ts,tsx,mts,cts}']
const reactRecommended = react.configs.flat.recommended

export const reactConfig = {
  ...reactRecommended,
  files: sourceFiles,
  plugins: {
    ...reactRecommended.plugins,
    react: fixupPluginRules(react),
    'react-hooks': fixupPluginRules(reactHooks),
    'react-refresh': fixupPluginRules(reactRefresh)
  },
  rules: {
    ...reactRecommended.rules,
    ...react.configs['jsx-runtime'].rules,
    ...reactHooks.configs.recommended.rules,
    'react/display-name': 'off',
    'react/prop-types': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest
      }
    },
    rules: {
      'linebreak-style': 'off',
      'no-async-promise-executor': 'off',
      'no-case-declarations': 'off',
      'no-cond-assign': 'off',
      'no-console': 'off',
      'no-constant-condition': 'off',
      'no-empty': 'off',
      'no-irregular-whitespace': 'off',
      'no-undef': 'off',
      'no-useless-assignment': 'off',
      'no-useless-escape': 'off',
      'no-var': 'off',
      'preserve-caught-error': 'off',
      'prefer-const': 'off',
      'indent': ['off', 2],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'semi': ['error', 'never'],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off'
    }
  },
  {
    files: typeScriptFiles,
    rules: {
      quotes: 'off'
    }
  }
)
