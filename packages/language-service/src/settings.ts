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
    classMatch: [
        '(class(?:Name)?\\s?=\\s?)((?:"[^"]+")|(?:\'[^\']+\')|(?:`[^`]+`))',
        '(class(?:Name)?={)([^}]*)}',
        '(?:(\\$|(?:(?:element|el|style)\\.[^\\s.`]+)`)([^`]+)`)',
        '(style\\.(?:.*)\\()([^)]*)\\)',
        '(classList.(?:add|remove|replace|replace|toggle)\\()([^)]*)\\)',
        '(template\\s*\\:\\s*)((?:"[^"]+")|(?:\'[^\']+\')|(?:`[^`]+`))',
        '(?<=styles\\s*(?:=|:)\\s*{[\\s\\S]*)([^\']*)(\'[^\']*\')',
        '(?<=styles\\s*(?:=|:)\\s*{[\\s\\S]*)([^"]*)("[^"]*")',
        '(?<=styles\\s*(?:=|:)\\s*{[\\s\\S]*)([^`]*)(`[^`]*`)'
    ],
    exclude: ['**/.git/**', '**/node_modules/**', '**/.hg/**'],
    suggestions: true,
    inspectSyntax: true,
    renderSyntaxColors: true,
    config: 'master.css'
}

export default settings

export interface Settings {
    languages?: string[]
    classMatch?: string[]
    exclude?: string[]
    suggestions?: boolean
    inspectSyntax?: boolean
    renderSyntaxColors?: boolean
    config?: string
}