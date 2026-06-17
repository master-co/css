import type { MarkupContent } from 'vscode-css-languageservice'
import beautifyCSS from './beautify-css'

export function getCSSDataDocumentation(additional?: {
    generatedCSS?: string
}): MarkupContent | undefined {
    const values: string[] = []
    if (additional?.generatedCSS) {
        const cssLines = beautifyCSS(additional.generatedCSS).split('\n')
        if (cssLines[0] === '') {
            cssLines.shift()
        }
        values.push(
            '```css\n'
            + cssLines.join('\n')
            + '\n```'
        )
    }
    return values?.length ? {
        kind: 'markdown',
        value: values.join('\n\n')
    } : undefined
}
