import {
  defaultLanguageServiceSettings,
  type MasterCSSLanguageServiceSettings
} from '@master/css-language-service'
import type { Pattern } from 'fast-glob'

export const defaultLanguageServerSettings: Readonly<MasterCSSLanguageServerSettings> = Object.freeze({
  ...defaultLanguageServiceSettings,
  workspaces: 'auto',
  verbose: false
})

export type MasterCSSLanguageServerSettings = MasterCSSLanguageServiceSettings & {
  workspaces?: readonly Pattern[] | 'auto'
  verbose?: boolean
}
