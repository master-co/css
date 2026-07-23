import { CLASS_ATTRIBUTES, CLASS_DECLARATIONS, CLASS_FUNCTIONS } from './master-css'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

export interface ClassPositionSettings {
  classAttributes?: string[]
  classFunctions?: string[]
  classDeclarations?: string[]
  classAttributeBindings?: Record<string, [string, string] | false>
}

const languageSettings: LanguageSettings = {
  classAttributes: CLASS_ATTRIBUTES,
  classAttributeBindings: {
    "className": ["{", "}"],
    "class": ["{", "}"],
    "class:list": ["{", "}"],
    ":class": ["\"", "\""],
    "v-bind:class": ["\"", "\""],
    "[class]": ["\"", "\""],
    "[className]": ["\"", "\""],
    "[ngClass]": ["\"", "\""]
  },
  classDeclarations: CLASS_DECLARATIONS,
  classFunctions: CLASS_FUNCTIONS,
  embeddedSyntaxHighlighting: 'active'
}

export default languageSettings

export interface LanguageSettings extends ClassPositionSettings {
  manifest?: MasterCSSManifest
  embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
}
