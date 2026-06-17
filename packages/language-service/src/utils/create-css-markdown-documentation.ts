import beautifyCSS from './beautify-css'

export interface CSSMarkdownDocumentation {
    kind: 'markdown'
    value: string
}

export default function createCSSMarkdownDocumentation(css: string): CSSMarkdownDocumentation | undefined {
    if (!css) return
    const cssLines = beautifyCSS(css).split('\n')
    if (cssLines[0] === '') {
        cssLines.shift()
    }
    return {
        kind: 'markdown',
        value: '```css\n' + cssLines.join('\n') + '\n```'
    }
}
