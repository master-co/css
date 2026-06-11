import { MasterCSS, createCSS, type SelectorVariantDefinition } from '@master/css'
import { generateCSS } from '@master/css/utils'
import cssDataProvider from './css-data-provider'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import { IPseudoElementData } from 'vscode-css-languageservice'

const kind = CompletionItemKind.Function

export default function getPseudoElementCompletionItems(css: MasterCSS = createCSS(), syntax: string): CompletionItem[] {
    const pseudoElementDataList = cssDataProvider.providePseudoElements()
    const completionItems = pseudoElementDataList
        .map((data) => {
            // fix https://github.com/microsoft/vscode-custom-data/issues/78
            const name = /::(?:part|slotted)/.test(data.name) ? data.name + '()' : data.name
            let sortText = name.startsWith('::-')
                ? 'zzzz' + name.slice(3)
                : 'zz' + name.replace(/^::/, '')
            if (sortText.endsWith('()')) sortText = 'z' + sortText
            return {
                label: name,
                sortText,
                documentation: getCSSDataDocumentation(data, {
                    generatedCSS: generateCSS([syntax + name.slice(2)], css),
                    docs: '/guide/theme#selector-variants'
                }),
                kind,
                data
            } as CompletionItem
        })

    const selectorVariants = (css.config.variants || [])
        .filter((variant): variant is SelectorVariantDefinition => 'selector' in variant && variant.raw.startsWith('::'))
    for (const variant of selectorVariants) {
        const selectorName = variant.raw
        const selectorValue = variant.selector.replace(/&/g, '')
        const name = selectorName.endsWith('(') ? selectorName + ')' : selectorName
        const value = typeof selectorValue === 'string'
            ? selectorValue.endsWith('(') ? selectorValue + ')' : selectorValue
            : selectorValue
        const data: IPseudoElementData | undefined = pseudoElementDataList.find((data) =>
            typeof value === 'string' ? value.startsWith(data.name) : false)
        let sortText = name.startsWith('::-')
            ? 'zzzz' + name.slice(3)
            : 'zz' + name.replace(/^::/, '')
        if (sortText.endsWith('()')) sortText = 'z' + sortText
        const completionItem: CompletionItem = {
            label: name,
            documentation: getCSSDataDocumentation(data, {
                generatedCSS: generateCSS([syntax + name.slice(2)], css),
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
