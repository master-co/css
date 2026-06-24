import { MasterCSS, createDefaultCSS, generateCSS } from '@master/css-language'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { createCompletionIndex, type CompletionIndex } from './completion-index'

const kind = CompletionItemKind.Function
const functionalPseudoClassNames = new Set([
    ':current',
    ':dir',
    ':has',
    ':has-slotted',
    ':host',
    ':host-context',
    ':is',
    ':lang',
    ':local-link',
    ':not',
    ':nth',
    ':nth-child',
    ':nth-col',
    ':nth-last',
    ':nth-last-child',
    ':nth-last-col',
    ':nth-last-of-type',
    ':nth-of-type',
    ':of',
    ':state',
    ':where'
])

function normalizeFunctionalPseudoClass(name: string): string {
    return functionalPseudoClassNames.has(name) ? name + '()' : name
}

export default function getPseudoClassCompletionItems(css: MasterCSS = createDefaultCSS(), syntax: string, completionIndex: CompletionIndex = createCompletionIndex(css)): CompletionItem[] {
    const completionItems = completionIndex.pseudoClassNames
        .map((pseudoClassName) => {
            const name = normalizeFunctionalPseudoClass(pseudoClassName)
            let sortText = name.startsWith(':-')
                ? 'yyyy' + name.slice(2)
                : 'yy' + name.replace(/^:/, '')
            if (sortText.endsWith('()')) sortText = 'y' + sortText
            return {
                label: name,
                sortText,
                documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(1)], css, completionIndex.runtime)),
                kind
            } as CompletionItem
        })

    for (const { token: name, selector } of completionIndex.pseudoClassSelectors) {
        if (name.startsWith('::')) continue
        const value = selector.replace(/&/g, '')
        const label = normalizeFunctionalPseudoClass(name)
        let sortText = label.startsWith(':-')
            ? 'yyyy' + label.slice(2)
            : 'yy' + label.replace(/^:/, '')
        if (sortText.endsWith('()')) sortText = 'y' + sortText
        const completionItem: CompletionItem = {
            label,
            documentation: createCSSMarkdownDocumentation(generateCSS([syntax + label.slice(1)], css, completionIndex.runtime)),
            sortText,
            kind,
            detail: String(value)
        }
        completionItems.push(completionItem)
    }

    return sortCompletionItems(completionItems)
}
