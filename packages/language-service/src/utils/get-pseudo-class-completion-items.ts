import { MasterCSS, createDefaultCSS, generateCSS } from '../master-css'
import cssDataProvider from './css-data-provider'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import { IPseudoClassData } from 'vscode-css-languageservice'
import { getCSSDataDocumentation } from './get-css-data-documentation'

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
    const pseudoClassDataList = cssDataProvider.providePseudoClasses()
        .filter((data) => {
            // exclude @page pseudo-classes
            if ([':first', ':left', ':right', ':blank'].includes(data.name)) return false
            return true
        })
    const completionItems = pseudoClassDataList
        .map((data) => {
            // fix https://github.com/microsoft/vscode-custom-data/issues/78
            const name = normalizeFunctionalPseudoClass(data.name)
            let sortText = name.startsWith(':-')
                ? 'yyyy' + name.slice(2)
                : 'yy' + name.replace(/^:/, '')
            if (sortText.endsWith('()')) sortText = 'y' + sortText
            return {
                label: name,
                sortText,
                documentation: getCSSDataDocumentation(data, {
                    generatedCSS: generateCSS([syntax + name.slice(1)], css),
                    docs: '/guide/theme#selector-variants'
                }),
                kind,
                data
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
        const data: IPseudoClassData | undefined = pseudoClassDataList.find((data) => value.startsWith(data.name))
        const label = normalizeFunctionalPseudoClass(name)
        let sortText = label.startsWith(':-')
            ? 'yyyy' + label.slice(2)
            : 'yy' + label.replace(/^:/, '')
        if (sortText.endsWith('()')) sortText = 'y' + sortText
        const completionItem: CompletionItem = {
            label,
            documentation: getCSSDataDocumentation(data, {
                generatedCSS: generateCSS([syntax + label.slice(1)], css),
                docs: '/guide/theme#selector-variants'
            }),
            sortText,
            kind,
            detail: String(value),
            data
        }
        completionItems.push(completionItem)
    }

    return sortCompletionItems(completionItems)
}
