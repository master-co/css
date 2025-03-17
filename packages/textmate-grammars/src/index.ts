import core from '../grammars/master-css.json'
import injectionClass from '../grammars/master-css.injection-class.json'
import injectionJS from '../grammars/master-css.injection-js.json'
import injectionReact from '../grammars/master-css.injection-react.json'
import injectionString from '../grammars/master-css.injection-string.json'
import injectionVue from '../grammars/master-css.injection-vue.json'
import type { LanguageRegistration } from 'shiki/types'

export declare type Grammar = {
    embeddedLanguages?: Record<string, string>
} & LanguageRegistration

const grammars = [
    core,
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
        embeddedLanguages: {
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