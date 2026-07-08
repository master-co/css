import type { Linter } from 'eslint'
import recommended from './recommended'

export default {
  plugins: ['@master/css'],
  rules: recommended.rules,
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
} as Linter.LegacyConfig