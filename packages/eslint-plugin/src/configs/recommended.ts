import type { Linter } from 'eslint'
import base from './base'

export default {
    ...base,
    rules: {
        '@master/css/class-order': 'warn',
        '@master/css/class-validation': 'error',
        '@master/css/class-collision': 'warn',
        '@master/css/class-recommended': 'warn'
    },
} as Linter.Config