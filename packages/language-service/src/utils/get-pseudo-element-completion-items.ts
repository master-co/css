import cssDataProvider from './css-data-provider'
import type { CompletionItem, CompletionItemKind } from 'vscode-languageserver'

// const nativeSelectors = [
//     { label: 'lang()', kind: 3 },
//     { label: 'has()', kind: 3 },
//     { label: 'nth-child()', kind: 3 },
//     { label: 'nth-last-child()', kind: 3 },
//     { label: 'nth-of-type()', kind: 3 },
//     { label: 'nth-last-of-type()', kind: 3 },
//     { label: 'host()', kind: 3 },
//     { label: 'host-context()', kind: 3 },
//     { label: 'is()', kind: 3 },
//     { label: 'not()', kind: 3 },
//     { label: 'where()', kind: 3 }
// ]

const insertTextMode = 1
const kind: CompletionItemKind = 3

const nativeCompletionItems = cssDataProvider.providePseudoElements()
    .map((data) => ({
        insertText: data.name,
        sortText: 'z' + data.name,
        label: data.name,
        documentation: data.description,
        insertTextMode,
        kind,
        data
    } as CompletionItem))

export default function getPseudoElementCompletionItems(): CompletionItem[] {
    return nativeCompletionItems
}