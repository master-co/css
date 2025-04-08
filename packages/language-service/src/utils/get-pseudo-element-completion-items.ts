import { MasterCSS, generateCSS } from '@master/css'
import cssDataProvider from './css-data-provider'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'
import { getCSSDataDocumentation } from './get-css-data-documentation'
import { IPseudoElementData } from 'vscode-css-languageservice'

const kind = CompletionItemKind.Function

export default function getPseudoElementCompletionItems(css: MasterCSS = new MasterCSS(), syntax: string): CompletionItem[] {
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
                    docs: '/guide/selectors'
                }),
                kind,
                data
            } as CompletionItem
        })

    for (const selectorName in css.config.selectors) {
        if (!selectorName.startsWith('::')) continue
        const selectorValue = css.config.selectors[selectorName]
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
                docs: '/guide/selectors'
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