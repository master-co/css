import { defaultClassLintSettings } from '@master/css-tooling/lint'
import type { MasterCSSManifest } from './utils/master-css'

const settings = {
  ...defaultClassLintSettings,
  manifest: undefined
}

export default settings

export interface Settings {
  classAttributes?: string[]
  classFunctions?: string[]
  classDeclarations?: string[]
  ignoredKeys: string[]
  manifest?: MasterCSSManifest
}
