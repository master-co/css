import { Config } from '@master/css'

const settings: Settings = {
    languages: [
        'html',
        'php',
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
        'vue',
        'svelte',
        'rust'
    ],
    classAttributes: ['class', 'className', 'ngClass'],
    exclude: ['**/.git/**', '**/node_modules/**', '**/.hg/**'],
    hintSyntaxCompletions: true,
    inspectSyntax: true,
    renderSyntaxColors: true
}

export default settings

export declare type Settings = {
    languages?: string[]
    classAttributes?: string[]
    exclude?: string[]
    hintSyntaxCompletions?: boolean
    inspectSyntax?: boolean
    renderSyntaxColors?: boolean
    config?: Config
}