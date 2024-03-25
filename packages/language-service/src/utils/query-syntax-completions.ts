import type { CompletionItem } from 'vscode-languageserver'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import { masterCssKeyValues, masterCssOtherKeys } from '../constant'
import { MasterCSS } from '@master/css'
import { TRIGGER_CHARACTERS } from '../common'
import getRuleKeyCompletionItems from './get-rule-key-completion-items'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCssOtherKeys)
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

export default function querySyntaxCompletions(q = '', css: MasterCSS) {
    const fields = q.split(' ')
    const field = fields[fields.length - 1]
    const triggerCharacter = q.charAt(q.length - 1)
    const completionItems: CompletionItem[] = []
    const invoked = triggerCharacter === ' ' || field.length === 0
    if (invoked) {
        return getRuleKeyCompletionItems(css, triggerCharacter)
    }
    const keyCompleted = new RegExp(`[${TRIGGER_CHARACTERS.selector.join('') + TRIGGER_CHARACTERS.at.join('')}]`).test(field.slice(1))
    if (!keyCompleted) {
        return getRuleKeyCompletionItems(css, triggerCharacter)
    }
    if (TRIGGER_CHARACTERS.selector.includes(triggerCharacter)) {
        if (field.endsWith('::')) {
            completionItems.push(...getPseudoElementCompletionItems(css, '::'))
        } else {
            completionItems.push(...getPseudoClassCompletionItems(css, ':'), ...getPseudoElementCompletionItems(css, '::'))
        }
    }
    // if (masterCssKeys.includes(key) && key !== null && isMedia === true) { //show media
    //     completionItems = completionItems.concat(getReturnItem(masterCssMedia as any, 10))
    //     // todo: refactor theme
    //     completionItems = completionItems.concat(getReturnItem(['light', 'dark'], 10))
    //     return completionItems
    // }

    // if (invoked) {
    //     return completionItems
    // } else if (masterCssKeys.includes(key) && haveValue <= 2 && !(haveValue == 2 && triggerCharacter === ':')) {  //show value
    //     completionItems = completionItems.concat(getReturnItem(masterCssValues, 10))
    //     completionItems = completionItems.concat(getReturnItem(masterCssCommonValues as any, 13).map(x => { x.sortText = 'z' + x; return x }))
    //     // if (isColorful) {
    //     //     completionItems = completionItems.concat(getColorCompletionItems(css))
    //     // }
    //     return completionItems
    // }

    return completionItems
}

// function haveDash(str: string, itemList: CompletionItem[]): CompletionItem[] {
//     const completionItem: CompletionItem[] = []
//     if (str.split('-').length - 1 <= 0) {
//         return itemList
//     }
//     else {
//         const start = str.split('-')[0] + '-'
//         itemList.map(x => {
//             if (x.label.includes(start)) {
//                 completionItem.push({
//                     label: x.label,
//                     kind: x.kind,
//                     insertText: x.insertText?.substring(start.length),
//                     insertTextMode: x.insertTextMode,
//                     command: x.command
//                 }
//                 )
//             }
//         })
//         return completionItem
//     }
// }