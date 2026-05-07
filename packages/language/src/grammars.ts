import type { LanguageRegistration } from 'shiki/types'
import declaration from './declaration'

export declare type Grammar = {
    /**
     * VS Code's grammar contribution shape. Shiki's `embeddedLanguages`
     * field is a string list, so keep this separate from the TextMate grammar
     * registration object passed to Shiki.
     */
    vscodeEmbeddedLanguages?: Record<string, string>
} & LanguageRegistration

const core = (await import('../syntaxes/master-css.json')).default
const injectionClass = (await import('../syntaxes/master-css.injection-class.json')).default
const injectionCSS = (await import('../syntaxes/master-css.injection-css.json')).default
const injectionJS = (await import('../syntaxes/master-css.injection-js.json')).default
const injectionReact = (await import('../syntaxes/master-css.injection-react.json')).default
const injectionString = (await import('../syntaxes/master-css.injection-string.json')).default
const injectionVue = (await import('../syntaxes/master-css.injection-vue.json')).default

const grammars = [
    {
        ...core,
        aliases: declaration.aliases
    },
    {
        ...injectionClass,
        injectTo: [
            'source',
            'text'
        ]
    },
    {
        ...injectionCSS,
        injectTo: [
            'source.css',
            'source.css.scss'
        ],
        embeddedLangs: [
            'master-css'
        ],
        vscodeEmbeddedLanguages: {
            'meta.embedded.block.master-css.class': 'master-css'
        },
    },
    {
        ...injectionReact,
        injectTo: [
            'source.js.jsx',
            'source.ts.tsx',
            'source.mdx',
            'source.jsx',
            'source.tsx'
        ]
    },
    {
        ...injectionVue,
        injectTo: [
            'source.vue'
        ]
    },
    {
        ...injectionJS,
        injectTo: [
            'source.js.jsx',
            'source.ts.tsx',
            'source.mdx',
            'source.jsx',
            'source.tsx',
            'source.js',
            'source.ts',
            'source.svelte',
            'source.vue'
        ],
        embeddedLangs: [
            'master-css'
        ],
        vscodeEmbeddedLanguages: {
            'meta.embedded.block.master-css.class': 'master-css'
        },
    },
    {
        ...injectionString,
        injectTo: [
            'source.js.jsx',
            'source.ts.tsx',
            'source.mdx',
            'source.jsx',
            'source.tsx',
            'source.js',
            'source.ts',
            'source.svelte',
            'source.vue'
        ]
    }
] as Grammar[]

export default grammars
