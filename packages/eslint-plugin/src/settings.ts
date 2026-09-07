import { defaultClassLintSettings } from '@master/css-tooling/lint'
import type { MasterCSSManifest } from './utils/master-css'

const settings = {
  ...defaultClassLintSettings,
  manifest: undefined
}

export default settings

export interface Settings {
  readonly classAttributes?: readonly string[]
  readonly classFunctions?: readonly string[]
  readonly classDeclarations?: readonly string[]
  readonly ignoredKeys: readonly string[]
  manifest?: MasterCSSManifest
}
