import { defineConfig } from 'eslint/config'
import masterCSS from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'

export default defineConfig([
  ...masterCSS,
  {
    files: [
      '*.html'
    ],
    languageOptions: {
      parser: htmlParser
    }
  },
  {
    files: ['*.ts', '*.tsx', '*.js'],
    languageOptions: {
      parser: tsParser
    }
  }
])
