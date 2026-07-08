import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'

export default defineConfig([
  ...css,
  {
    files: [
      '*.html'
    ],
    languageOptions: {
      parser: htmlParser
    }
  }
])
