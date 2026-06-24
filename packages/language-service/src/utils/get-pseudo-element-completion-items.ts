import { MasterCSS, createDefaultCSS, generateCSS } from '@master/css-language'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

const kind = CompletionItemKind.Function

export default function getPseudoElementCompletionItems(css: MasterCSS = createDefaultCSS(), syntax: string, completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
    const completionItems = completionIndex.pseudoElementNames
        .map((pseudoElementName) => {
            const name = /::(?:part|slotted)/.test(pseudoElementName) ? pseudoElementName + '()' : pseudoElementName
            let sortText = name.startsWith('::-')
                ? 'zzzz' + name.slice(3)
                : 'zz' + name.replace(/^::/, '')
            if (sortText.endsWith('()')) sortText = 'z' + sortText
            return {
                label: name,
                sortText,
                documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(2)], css, completionIndex.runtime)),
                kind
            } as CompletionItem
        })

    for (const variant of completionIndex.pseudoElementSelectors) {
        const selectorName = variant.token
        const selectorValue = variant.selector.replace(/&/g, '')
        const name = selectorName.endsWith('(') ? selectorName + ')' : selectorName
        const value = typeof selectorValue === 'string'
            ? selectorValue.endsWith('(') ? selectorValue + ')' : selectorValue
            : selectorValue
        let sortText = name.startsWith('::-')
            ? 'zzzz' + name.slice(3)
            : 'zz' + name.replace(/^::/, '')
        if (sortText.endsWith('()')) sortText = 'z' + sortText
        const completionItem: CompletionItem = {
            label: name,
            documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(2)], css, completionIndex.runtime)),
            sortText,
            kind,
            detail: String(value)
        }
        completionItems.push(completionItem)
    }

    return sortCompletionItems(completionItems)
}
