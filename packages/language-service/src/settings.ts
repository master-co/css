import { CLASS_ATTRIBUTES, CLASS_FUNCTIONS, CLASS_DECLARATIONS } from './master-css'
import type { MasterCSSPlan } from '@master/css'

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
    classAttributes: CLASS_ATTRIBUTES,
    /**
     * @example <div class={active ? 'a' : 'b'}>
     * @example <div className={active ? 'a' : 'b'}>
     */
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
    /**
     * @example const classes = 'a b'
     * @example { classes: { btn: 'a b' } }
     */
    classDeclarations: CLASS_DECLARATIONS,
    /**
     * @example clsx('a b')
     * @example styled`a b`
     * @example .classList.add('a')
     */
    classFunctions: CLASS_FUNCTIONS,
    exclude: ["**/.git/**", "**/node_modules/**", "**/.hg/**"],
    suggestSyntax: true,
    inspectSyntax: true,
    renderSyntaxColors: true,
    editSyntaxColors: true,
    embeddedSyntaxHighlighting: 'active'
}

export default settings

export declare interface Settings {
    includedLanguages?: string[]
    classAttributes?: string[]
    classFunctions?: string[]
    classDeclarations?: string[]
    classAttributeBindings?: Record<string, [string, string] | false>
    exclude?: string[]
    plan?: MasterCSSPlan
    // features
    suggestSyntax?: boolean
    inspectSyntax?: boolean
    renderSyntaxColors?: boolean
    editSyntaxColors?: boolean
    embeddedSyntaxHighlighting?: 'active' | 'always' | 'off'
}
