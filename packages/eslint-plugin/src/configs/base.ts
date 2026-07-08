import plugin from '../plugin'
import type { Linter } from 'eslint'

export default {
  plugins: {
    '@master/css': plugin as any
  }
} as Linter.Config