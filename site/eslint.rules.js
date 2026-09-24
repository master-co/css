import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'
import next from '@next/eslint-plugin-next'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tsParser from '@typescript-eslint/parser'
import * as mdx from 'eslint-mdx'

const reactHooksConfig = {
  plugins: {
    'react-hooks': reactHooks
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}

const typescriptConfig = {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      },
      sourceType: 'module'
    }
  }
}

const projectConfig = {
  settings: {
    react: {
      version: '19.2.5'
    }
  },
  rules: {
    '@next/next/no-head-element': 'off',
    '@next/next/no-img-element': 'error',
    '@next/next/google-font-display': 'off',
    '@next/next/google-font-preconnect': 'off',
    '@next/next/no-page-custom-font': 'off',
    'import/no-anonymous-default-export': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    'no-html-link-for-pages': 'off',
    'react/display-name': 'off',
    'react/react-in-jsx-scope': 'off'
  },
}

const configs = [
  next.configs.recommended,
  next.configs['core-web-vitals'],
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooksConfig,
  typescriptConfig,
  projectConfig,
  ...css
]

const mdxDisabledRules = Object.fromEntries(configs
  .flatMap((config) => Object.keys(config.rules || {}))
  .filter((rule) => !rule.startsWith('@master/css/'))
  .map((rule) => [rule, 'off']))

export default defineConfig([
  ...configs,
  {
    files: ['**/*.mdx'],
    languageOptions: {
      parser: mdx
    },
    rules: mdxDisabledRules
  }
])
