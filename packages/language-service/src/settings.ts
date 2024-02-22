export const settings = {
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
    inspect: true,
    previewColors: true,
    config: 'master.css'
}