import css from '@master/eslint-config-css'
import htmlParser from '@angular-eslint/template-parser'
import tsParser from '@typescript-eslint/parser'

export default [
    css,
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
]