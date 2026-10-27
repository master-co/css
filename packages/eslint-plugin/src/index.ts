import settings from './settings'
import base from './configs/base'
import recommendedSource from './configs/recommended'
import plugin from './plugin'
import type { Linter } from 'eslint'
import type { TSESLint } from '@typescript-eslint/utils'

const masterCSSPlugin: Omit<TSESLint.Linter.Plugin, 'configs'> & {
  configs: {
    base: Linter.Config
    recommended: Linter.Config[]
    source: Linter.Config
  }
  settings: typeof settings
} = {
  ...plugin,
  configs: {
    base,
    recommended: [recommendedSource],
    source: recommendedSource
  },
  settings
}

export { masterCSSPlugin as masterCSS }
export default masterCSSPlugin
