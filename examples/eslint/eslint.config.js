import { defineConfig } from 'eslint/config'
import masterCSS from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'
import { flat } from 'eslint-plugin-mdx'

export default defineConfig([
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser
    }
  },
  flat,
  ...masterCSS,
  {
    rules: {
      '@master/css/no-invalid-classes': ['error', {
        disallowUnknownClass: true
      }]
    },
    settings: {
      'mdx/code-blocks': true
    }
  }
])
