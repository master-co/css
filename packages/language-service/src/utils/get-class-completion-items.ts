import { type CompletionItem } from 'vscode-languageserver-protocol'
import { MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type ClassCompletionEntry, type CompletionIndex } from './completion-index'

function createCompletionItem(css: MasterCSS, entry: ClassCompletionEntry): CompletionItem {
    const { documentationClassName, ...completionItem } = entry
    return {
        ...completionItem,
        ...(documentationClassName
            ? { documentation: createCSSMarkdownDocumentation(generateCSS([documentationClassName], css)) }
            : {})
    }
}

export default function getClassCompletionItems(css: MasterCSS = createDefaultCSS(), completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
    return completionIndex.classEntries.map((entry) => createCompletionItem(css, entry))
}
