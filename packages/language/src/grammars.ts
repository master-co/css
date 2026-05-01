import core from '../syntaxes/master-css.json'
import injectionClass from '../syntaxes/master-css.injection-class.json'
import injectionJS from '../syntaxes/master-css.injection-js.json'
import injectionReact from '../syntaxes/master-css.injection-react.json'
import injectionString from '../syntaxes/master-css.injection-string.json'
import injectionVue from '../syntaxes/master-css.injection-vue.json'
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
