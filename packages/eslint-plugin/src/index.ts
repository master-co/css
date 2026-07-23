import settings from './settings'
import base from './configs/base'
import recommendedSource from './configs/recommended'
import stylesheet from './configs/stylesheet'
import plugin from './plugin'
import type { Linter } from 'eslint'
import type { TSESLint } from '@typescript-eslint/utils'

const masterCSSPlugin: Omit<TSESLint.Linter.Plugin, 'configs'> & {
  configs: {
    base: Linter.Config
    recommended: Linter.Config[]
    source: Linter.Config
    stylesheet: Linter.Config
  }
  settings: typeof settings
} = {
  ...plugin,
  configs: {
    base,
    recommended: [recommendedSource, stylesheet],
    source: recommendedSource,
    stylesheet
  },
  settings
}

export { masterCSSPlugin as masterCSS }
export default masterCSSPlugin
