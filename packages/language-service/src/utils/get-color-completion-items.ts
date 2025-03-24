import { MasterCSS } from '@master/css'
import { type CompletionItem, CompletionItemKind } from 'vscode-languageserver-protocol'
import sortCompletionItems from './sort-completion-items'

export default function getColorCompletionItems(css: MasterCSS = new MasterCSS()): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    css.variables.forEach((eachVariable, eachVariableName) => {
        if (eachVariable.type === 'color') {
            // todo: packages/core should support getTextByVariable(variable)
            const valueToken = (eachVariable.space && eachVariable.value)
                ? `${eachVariable.space}(${eachVariable.value})`
                : eachVariable.value
            completionItems.push({
                label: eachVariableName,
                // detail is shown in the detail pane
                // todo: eachVariable.token should be recorded as original config variable
                detail: valueToken,
                // documentation is shown in the hover
                // todo: should convert and space to rgba
                documentation: (eachVariable.space && eachVariable.value)
                    // vscode doesn't support rgba(0 0 0/.5) in detail
                    ? `${eachVariable.space}(${eachVariable.value.split(' ').join(',')})`
                    : eachVariable.value,
                kind: CompletionItemKind.Color,
                sortText: eachVariableName.replace(/(.+?)-(\d+)/, (match, prefix, num) =>
                    prefix + '-' + ('00000' + num).slice(-5)),
            })
        }
    })
    return sortCompletionItems(completionItems)
}
