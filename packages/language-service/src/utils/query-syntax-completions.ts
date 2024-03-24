import type { CompletionItem, CompletionItemKind, CompletionTriggerKind, Position } from 'vscode-languageserver'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import cssDataProvider from './css-data-provider'
import { masterCssCommonValues, masterCssKeyValues, masterCssMedia, masterCssOtherKeys, masterCssType } from '../constant'
import { MasterCSS } from '@master/css'
import getColorCompletionItems from './get-color-completion-items'
import { TRIGGER_CHARACTERS } from '../common'
import getRuleKeyCompletionItems from './get-rule-key-completion-items'
import analyzeSyntaxCompletionStates from './analyze-syntax-completion-states'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCssOtherKeys)
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

const masterCssKeys: Array<string | CompletionItem> = [...new Set(cssKeys)]

export default function querySyntaxCompletions(q = '', css: MasterCSS) {
    const key = q.split(':')[0].trim()
    const haveValue = q.split(':').length
    const instanceLength = q.split(':|@').length
    const last = q.split(':|@')[instanceLength - 1]
    const mediaPattern = /[^\\s"]+@+([^\\s:"@]+)/g
    const lastCharacter = q.charAt(q.length - 1)
    const completionItems: CompletionItem[] = []
    // let isColorful = false
    const masterCssKeyCompletionItems: Array<CompletionItem> = []
    const masterCssValues: Array<string | CompletionItem> = []
    const { keyCompleted } = analyzeSyntaxCompletionStates(q)
    if (!keyCompleted) {
        // @delay: @duration: ~durationz:
        if (TRIGGER_CHARACTERS.invoked.includes(lastCharacter) || q === '@' || q === '~') {
            return getRuleKeyCompletionItems(lastCharacter, css)
        }
    }
    if (TRIGGER_CHARACTERS.selector.includes(lastCharacter)) {
        if (q.endsWith('::')) {
            completionItems.push(...getPseudoElementCompletionItems('::'))
        } else {
            completionItems.push(...getPseudoClassCompletionItems(':'), ...getPseudoElementCompletionItems('::'))
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


function getReturnItem(items: Array<string | CompletionItem>, kind: CompletionItemKind): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    items.forEach(x => {
        if (typeof x === 'string') {
            completionItems.push({
                label: x,
                kind: kind,
                insertText: x,
                insertTextMode: 2
            })
        } else {
            completionItems.push({
                insertText: x.label,
                insertTextMode: 2,
                ...x
            })
        }
    })
    return completionItems
}

function haveDash(str: string, itemList: CompletionItem[]): CompletionItem[] {
    const completionItem: CompletionItem[] = []
    if (str.split('-').length - 1 <= 0) {
        return itemList
    }
    else {
        const start = str.split('-')[0] + '-'
        itemList.map(x => {
            if (x.label.includes(start)) {
                completionItem.push({
                    label: x.label,
                    kind: x.kind,
                    insertText: x.insertText?.substring(start.length),
                    insertTextMode: x.insertTextMode,
                    command: x.command
                }
                )
            }
        })
        return completionItem
    }
}