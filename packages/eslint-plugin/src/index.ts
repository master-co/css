import settings from './settings'
import legacy from './configs/legacy'
import base from './configs/base'
import recommended from './configs/recommended'
import stylesheet from './configs/stylesheet'
import plugin from './plugin'
import type { Linter } from 'eslint'
import type { TSESLint } from '@typescript-eslint/utils'

const masterCSSPlugin: Omit<TSESLint.Linter.Plugin, 'configs'> & {
  configs: {
    legacy: unknown
    base: Linter.Config
    recommended: Linter.Config
    stylesheet: Linter.Config
  }
  settings: typeof settings
} = {
  ...plugin,
  configs: {
    legacy,
    base,
    recommended,
    stylesheet
  },
  settings
}

export default masterCSSPlugin
