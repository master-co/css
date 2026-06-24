import { type CompletionItem } from 'vscode-languageserver-protocol'
import { MasterCSS, createDefaultCSS, generateCSS } from '@master/css-language'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

export default function getClassCompletionItems(css: MasterCSS = createDefaultCSS(), completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
    return completionIndex.classEntries.map((entry) => {
        const { documentationClassName, ...completionItem } = entry
        return {
            ...completionItem,
            ...(documentationClassName
                ? { documentation: createCSSMarkdownDocumentation(generateCSS([documentationClassName], css, completionIndex.runtime)) }
                : {})
        }
    })
}
