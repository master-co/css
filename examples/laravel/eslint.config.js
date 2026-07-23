import js from '@eslint/js'
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { defineConfig, globalIgnores } from 'eslint/config'
import masterCSS from '@master/eslint-plugin-css'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import typescript from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'vendor/**',
    'node_modules/**',
    'public/**',
    'bootstrap/ssr/**'
  ]),
  {
    files: ['resources/**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      typescript.configs.recommended,
      ...fixupConfigRules(react.configs.flat.recommended),
      ...fixupConfigRules(react.configs.flat['jsx-runtime'])
    ],
    languageOptions: {
      globals: globals.browser
    },
    plugins: {
      'react-hooks': fixupPluginRules(reactHooks)
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  ...masterCSS.configs.recommended,
  {
    rules: {
      '@master/css/no-invalid-classes': 'warn'
    }
  },
  prettier
])
