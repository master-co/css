import masterCSS from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'

export default [
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser
    }
  },
  ...masterCSS
]
