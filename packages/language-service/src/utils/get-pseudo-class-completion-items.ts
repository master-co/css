import { MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import createCSSMarkdownDocumentation from './create-css-markdown-documentation'
import { getMdnPseudoClassNames } from './mdn-css-data'

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

export default function getPseudoClassCompletionItems(css: MasterCSS = createDefaultCSS(), syntax: string): CompletionItem[] {
    const pseudoClassNames = getMdnPseudoClassNames()
    const completionItems = pseudoClassNames
        .map((pseudoClassName) => {
            const name = normalizeFunctionalPseudoClass(pseudoClassName)
            let sortText = name.startsWith(':-')
                ? 'yyyy' + name.slice(2)
                : 'yy' + name.replace(/^:/, '')
            if (sortText.endsWith('()')) sortText = 'y' + sortText
            return {
                label: name,
                sortText,
                documentation: createCSSMarkdownDocumentation(generateCSS([syntax + name.slice(1)], css)),
                kind
            } as CompletionItem
        })

    const selectors: Record<string, string> = {
        ':of': ':of',
    }
    for (const variant of css.plan.variants || []) {
        const selector = variant.branches.find((branch) => branch.selector)?.selector
        if (selector && variant.token.startsWith(':') && !variant.token.startsWith('::')) {
            selectors[variant.token] = selector
        }
    }

    for (const name in selectors) {
        if (name.startsWith('::')) continue
        const value = selectors[name].replace(/&/g, '')
        const label = normalizeFunctionalPseudoClass(name)
        let sortText = label.startsWith(':-')
            ? 'yyyy' + label.slice(2)
            : 'yy' + label.replace(/^:/, '')
        if (sortText.endsWith('()')) sortText = 'y' + sortText
        const completionItem: CompletionItem = {
            label,
            documentation: createCSSMarkdownDocumentation(generateCSS([syntax + label.slice(1)], css)),
            sortText,
            kind,
            detail: String(value)
        }
        completionItems.push(completionItem)
    }

    return sortCompletionItems(completionItems)
}
