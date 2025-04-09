import type { CompletionItem } from 'vscode-languageserver-protocol'

/* localeCompare equals to the real vscode completion items sorting */
export default function sortCompletionItems(items: CompletionItem[]) {
    return items.sort((a, b) => {
        const sortTextA = a.sortText || a.label
        const sortTextB = b.sortText || b.label
        return sortTextA.localeCompare(sortTextB, undefined, { numeric: true })
    })
}