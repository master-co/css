import { MasterCSS } from '@master/css'
import cssDataProvider from './css-data-provider'
import type { CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'

const insertTextMode = 1
const kind: CompletionItemKind = 3

export default function getPseudoClassCompletionItems(css: MasterCSS, sign = ''): CompletionItem[] {
    return cssDataProvider.providePseudoClasses()
        .map((data) => {
            // fix https://github.com/microsoft/vscode-custom-data/issues/78
            const name = /:(?:dir|has|is|nth-col|where)/.test(data.name) ? data.name + '()' : data.name
            let sortText = name.startsWith(':-')
                ? 'zz' + name.slice(2)
                : name.replace(/^:/, '')
            if (sortText.endsWith('()')) sortText = 'z' + sortText
            return {
                label: name,
                insertText: name.slice(sign.length),
                sortText,
                documentation: data.description,
                insertTextMode,
                kind,
                data
            } as CompletionItem
        })
}