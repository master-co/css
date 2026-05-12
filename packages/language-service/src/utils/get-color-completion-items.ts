import { MasterCSS, createCSS } from '@master/css'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'

export default function getColorCompletionItems(css: MasterCSS = createCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    css.variables.forEach((eachVariable, eachVariableName) => {
        if (eachVariable.namespace?.startsWith('color')) {
            const valueToken = eachVariable.value ?? eachVariable.name
            completionItems.push({
                label: eachVariableName,
                // detail is shown in the detail pane
                detail: String(valueToken),
                // documentation is shown in the hover
                documentation: String(valueToken),
                kind: CompletionItemKind.Color,
                sortText: eachVariableName.replace(/(.+?)-(\d+)/, (match, prefix, num) =>
                    prefix + '-' + ('00000' + num).slice(-5)),
            })
        }
    })
    return sortCompletionItems(completionItems)
}
