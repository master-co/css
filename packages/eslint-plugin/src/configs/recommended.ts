import type { Linter } from 'eslint'
import base from './base'

export default {
  ...base,
  rules: {
    '@master/css/sort-classes': 'warn',
    '@master/css/no-invalid-classes': 'error',
    '@master/css/no-conflicting-classes': 'warn',
    '@master/css/prefer-canonical-classes': 'warn'
  },
} as Linter.Config
