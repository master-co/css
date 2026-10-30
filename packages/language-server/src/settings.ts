import {
  defaultLanguageServiceSettings,
  type MasterCSSLanguageServiceSettings
} from '@master/css-language-service'
import type { Pattern } from 'fast-glob'
import type { MasterCSSDesignSystemOptions } from '@master/css-tooling/lint'

export const defaultLanguageServerSettings: Readonly<MasterCSSLanguageServerSettings> = Object.freeze({
  ...defaultLanguageServiceSettings,
  workspaces: 'auto',
  verbose: false
})

export type MasterCSSLanguageServerSettings = MasterCSSLanguageServiceSettings & {
  workspaces?: readonly Pattern[] | 'auto'
  verbose?: boolean
  /** Opt-in checks for authored CSS in this workspace's managed stylesheet graph. */
  designSystem?: MasterCSSDesignSystemOptions
}
