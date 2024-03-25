import type { CompletionItem } from 'vscode-languageserver'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import { masterCssKeyValues, masterCssOtherKeys } from '../constant'
import { MasterCSS } from '@master/css'
import { TRIGGER_CHARACTERS } from '../common'
import getMainCompletionItems from './get-main-completion-items'
import { AT_SIGN, SELECTOR_SIGNS } from '@master/css/common'
import getValueCompletionItems from './get-value-completion-items'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCssOtherKeys)
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

export default function querySyntaxCompletions(q = '', css: MasterCSS = new MasterCSS()) {
    const fields = q.split(' ')
    const field = fields[fields.length - 1]
    const triggerCharacter = q.charAt(q.length - 1)
    const completionItems: CompletionItem[] = []
    const invoked = triggerCharacter === ' ' || field.length === 0
    if (invoked) {
        return getMainCompletionItems(css)
    }
    const subFields = field.split(':')
    const fieldBeforeFirstColon = subFields[0]
    const styleNames = Object.keys(css.config.styles || {})
    const semanticNames = Object.keys(css.config.semantics || {})
    const isStyle = styleNames.includes(fieldBeforeFirstColon)
    const isSemantic = semanticNames.includes(fieldBeforeFirstColon)
    // check by semantics and styles
    let keyCompleted = isStyle || isSemantic
    const valueCompleted = keyCompleted
    if (!keyCompleted) {
        keyCompleted = new RegExp(`[${SELECTOR_SIGNS.join('') + AT_SIGN}]`).test(field.slice(1))
    }
    /**
     * The server capability sets '@' '~' as the trigger characters for at and adjacent selectors,
     * but these two characters are also the prefix symbols of `animation` and `transition`,
     * and should be filtered to prevent hints all completions items.
     * @example class="@"
     * @example class="~"
     */
    if (!keyCompleted && (field.startsWith('@') || field.startsWith('~'))) {
        return getMainCompletionItems(css)
            .filter(completionItem => completionItem.label.startsWith(field))
            .map((completionItem) => ({ ...completionItem, label: completionItem.label.slice(1) }))
    }
    if (!keyCompleted) {
        return getMainCompletionItems(css)
    }
    if (!valueCompleted && subFields[1] === '') {
        return getValueCompletionItems(subFields[0], css)
    }
    if (isStyle) return
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