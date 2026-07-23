import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  CLASS_ATTRIBUTES,
  CLASS_DECLARATIONS,
  CLASS_FUNCTIONS
} from '@master/css-tooling/language'

/**
 * @example styles https://regex101.com/r/HLPdsw/1
 **/

export interface MasterCSSLanguageServiceSettings {
  includedLanguages?: string[]
  exclude?: string[]
  manifest?: MasterCSSManifest
  classAttributes?: string[]
  classFunctions?: string[]
  classDeclarations?: string[]
  classAttributeBindings?: Record<string, [string, string] | false>
  embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
  suggestSyntax?: boolean
  inspectSyntax?: boolean
  renderSyntaxColors?: boolean
  editSyntaxColors?: boolean
  formatDirectives?: boolean
}

export const defaultLanguageServiceSettings: Readonly<MasterCSSLanguageServiceSettings> = Object.freeze({
  includedLanguages: Object.freeze([
    "html",
    "php",
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
    "css",
    "scss",
    "less",
    "vue",
    "svelte",
    "rust",
    "astro",
    "markdown",
    "mdx",
    "astro"
  ]) as string[],
  /**
   * @example <div class="a b">
   * @example <div className="a b">
   */
  classAttributes: Object.freeze([...CLASS_ATTRIBUTES]) as string[],
  /**
   * @example <div class={active ? 'a' : 'b'}>
   * @example <div className={active ? 'a' : 'b'}>
   */
  classAttributeBindings: Object.freeze({
    "className": Object.freeze(["{", "}"]) as [string, string],
    "class": Object.freeze(["{", "}"]) as [string, string],
    "class:list": Object.freeze(["{", "}"]) as [string, string],
    ":class": Object.freeze(["\"", "\""]) as [string, string],
    "v-bind:class": Object.freeze(["\"", "\""]) as [string, string],
    "[class]": Object.freeze(["\"", "\""]) as [string, string],
    "[className]": Object.freeze(["\"", "\""]) as [string, string],
    "[ngClass]": Object.freeze(["\"", "\""]) as [string, string]
  }),
  /**
   * @example const classes = 'a b'
   * @example { classes: { btn: 'a b' } }
   */
  classDeclarations: Object.freeze([...CLASS_DECLARATIONS]) as string[],
  /**
   * @example clsx('a b')
   * @example styled`a b`
   * @example .classList.add('a')
   */
  classFunctions: Object.freeze([...CLASS_FUNCTIONS]) as string[],
  exclude: Object.freeze(["**/.git/**", "**/node_modules/**", "**/.hg/**"]) as string[],
  suggestSyntax: true,
  inspectSyntax: true,
  renderSyntaxColors: true,
  editSyntaxColors: true,
  formatDirectives: true,
  embeddedSyntaxHighlighting: 'active'
})
