import css from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'

export default [
    css,
    {
        files: [
            '*.html'
        ],
        languageOptions: {
            parser: htmlParser
        }
    }
]