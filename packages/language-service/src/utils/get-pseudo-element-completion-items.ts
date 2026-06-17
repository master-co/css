import { MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { getMdnPseudoElementNames } from './mdn-css-data'

const kind = CompletionItemKind.Function

export default function getPseudoElementCompletionItems(css: MasterCSS = createDefaultCSS(), syntax: string): CompletionItem[] {
    const pseudoElementNames = getMdnPseudoElementNames()
    const completionItems = pseudoElementNames
        .map((pseudoElementName) => {
            const name = /::(?:part|slotted)/.test(pseudoElementName) ? pseudoElementName + '()' : pseudoElementName
            let sortText = name.startsWith('::-')
                ? 'zzzz' + name.slice(3)
                : 'zz' + name.replace(/^::/, '')
            if (sortText.endsWith('()')) sortText = 'z' + sortText
            return {
                label: name,
                sortText,
                documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(2)], css)),
                kind
            } as CompletionItem
        })

    const selectorVariants = (css.plan.variants || [])
        .map((variant) => ({ token: variant.token, selector: variant.branches.find((branch) => branch.selector)?.selector }))
        .filter((variant): variant is { token: `::${string}`, selector: string } => Boolean(variant.selector) && variant.token.startsWith('::'))
    for (const variant of selectorVariants) {
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
            documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(2)], css)),
            sortText,
            kind,
            detail: String(value)
        }
        completionItems.push(completionItem)
    }

    return sortCompletionItems(completionItems)
}
