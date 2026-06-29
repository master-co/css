import { languageSettings, type LanguageSettings } from '@master/css-language'
import type { MasterCSSManifest } from '@master/css'

/**
 * @example styles https://regex101.com/r/HLPdsw/1
 **/

const settings: Settings = {
    includedLanguages: [
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
    ],
    /**
     * @example <div class="a b">
     * @example <div className="a b">
     */
    classAttributes: languageSettings.classAttributes,
    /**
     * @example <div class={active ? 'a' : 'b'}>
     * @example <div className={active ? 'a' : 'b'}>
     */
    classAttributeBindings: languageSettings.classAttributeBindings,
    /**
     * @example const classes = 'a b'
     * @example { classes: { btn: 'a b' } }
     */
    classDeclarations: languageSettings.classDeclarations,
    /**
     * @example clsx('a b')
     * @example styled`a b`
     * @example .classList.add('a')
     */
    classFunctions: languageSettings.classFunctions,
    exclude: ["**/.git/**", "**/node_modules/**", "**/.hg/**"],
    suggestSyntax: true,
    inspectSyntax: true,
    renderSyntaxColors: true,
    editSyntaxColors: true,
    formatDirectives: true,
    embeddedSyntaxHighlighting: 'active'
}

export default settings

export declare interface Settings extends LanguageSettings {
    includedLanguages?: string[]
    exclude?: string[]
    manifest?: MasterCSSManifest
    // features
    suggestSyntax?: boolean
    inspectSyntax?: boolean
    renderSyntaxColors?: boolean
    editSyntaxColors?: boolean
    formatDirectives?: boolean
}
