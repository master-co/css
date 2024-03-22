import cssDataProvider from './css-data-provider'
import type { CompletionItem, CompletionItemKind } from 'vscode-languageserver'

const insertTextMode = 1
const kind: CompletionItemKind = 3

export default function getPseudoElementCompletionItems(triggerKey: string): CompletionItem[] {
    return cssDataProvider.providePseudoElements()
        .map((data) => {
            // fix https://github.com/microsoft/vscode-custom-data/issues/78
            const name = /::(?:part|slotted)/.test(data.name) ? data.name + '()' : data.name
            let sortText = name.startsWith('::-')
                ? 'zz' + name.slice(3) // 'z' to put it at the end
                : name.replace(/^::/, '')
            if (sortText.endsWith('()')) sortText = 'z' + sortText
            return {
                label: name,
                insertText: name.slice(triggerKey.length),
                sortText: 'zzzz' + sortText,
                documentation: data.description,
                insertTextMode,
                kind,
                data
            } as CompletionItem
        })
}