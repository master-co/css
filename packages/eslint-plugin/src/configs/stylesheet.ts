import plugin from '../plugin'
import stylesheetParser from '../stylesheet-parser'
import type { Linter } from 'eslint'

export default {
    files: ['**/*.{css,scss,less}'],
    plugins: {
        '@master/css': plugin as any
    },
    languageOptions: {
        parser: stylesheetParser
    },
    rules: {
        '@master/css/prefer-canonical-classes': 'warn'
    }
} as Linter.Config
