import type { CompletionItem, CompletionItemKind, CompletionTriggerKind, Position } from 'vscode-languageserver'
import getPseudoClassCompletionItems from './get-pseudo-class-completion-items'
import getPseudoElementCompletionItems from './get-pseudo-element-completion-items'
import cssDataProvider from './css-data-provider'
import { masterCssCommonValues, masterCssKeyValues, masterCssMedia, masterCssOtherKeys, masterCssType } from '../constant'
import { MasterCSS } from '@master/css'
import getColorCompletionItems from './get-color-completion-items'
import { triggerCharacters } from '../common'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCssOtherKeys)
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

const masterCssKeys: Array<string | CompletionItem> = [...new Set(cssKeys)]

export default function getCompletionItems(q: string, triggerKind: CompletionTriggerKind | undefined, triggerCharacter: string | undefined, language: string, css: MasterCSS) {
    const invoked = triggerCharacters.invoked.includes(triggerCharacter || '')
    const key = q.split(':')[0].trim()
    const haveValue = q.split(':').length
    const instanceLength = q.split(':|@').length
    const last = q.split(':|@')[instanceLength - 1]
    const mediaPattern = /[^\\s"]+@+([^\\s:"@]+)/g
    const isMedia = !(mediaPattern.exec(q) === null && triggerCharacter !== '@')
    let completionItems: CompletionItem[] = []
    let isColorful = false
    const masterCssKeyCompletionItems: Array<CompletionItem> = []
    let masterCssValues: Array<string | CompletionItem> = []
    switch (triggerCharacter) {
        case '::':
            completionItems.push(...getPseudoElementCompletionItems(triggerCharacter))
            break
        case ':':
            completionItems.push(...getPseudoClassCompletionItems(triggerCharacter), ...getPseudoElementCompletionItems(triggerCharacter))
            break
    }
    masterCssKeyValues.forEach(x => {
        const fullKey = x.key[0]
        const originalCssProperty = cssDataProvider.provideProperties().find((x: { name: string }) => x.name == fullKey)
        const originalCssValues = originalCssProperty?.values ?? []
        for (const masterKey of x.key) {
            if (!masterCssKeyCompletionItems.find(existedValue => existedValue.label === masterKey + ':')) {
                masterCssKeyCompletionItems.push({
                    label: masterKey + ':',
                    kind: 10,
                    documentation: originalCssProperty?.description ?? '',
                    command: {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                })
            }
        }

        if (x.key.includes(key)) {
            // constant.ts custom values
            masterCssValues = masterCssValues.concat(
                x.values.filter(cssValue =>
                    !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
                )
            )

            masterCssValues = masterCssValues.concat(
                originalCssValues
                    .filter((cssValue, index) => cssValue.description || (!cssValue.description && originalCssValues.indexOf(cssValue) === index))
                    .map((cssValue) => ({
                        label: cssValue.name.replace(/,\s/g, ',').replace(/\s/g, '|').replace(/["']/g, ''),
                        kind: 10,
                        documentation: cssValue?.description ?? ''
                    } as CompletionItem))
                    .filter((cssValue: { label: any }) =>
                        !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
                    )
            )

            if (css.config?.variables?.[fullKey]) {
                const masterCustomVariables = Object.keys(css.config?.variables[fullKey])
                masterCssValues = masterCssValues.concat(
                    masterCustomVariables
                        .filter(customValue =>
                            !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === customValue)
                        )
                )
            }

            if (x.colored) {
                isColorful = true
                const needPushList = masterCssType.find(y => y.type === 'color')?.values.filter(z => !masterCssValues.find(a => (typeof a === 'string' ? a : a.label) === (typeof z === 'string' ? z : z.label)))
                if (needPushList) {
                    masterCssValues = masterCssValues.concat(needPushList as any)
                }
            }
        }
    })

    if ((!masterCssKeys.includes(key)) && triggerCharacter !== '@' && triggerCharacter !== ':') {  //ex " background"
        completionItems = completionItems.concat(masterCssKeyCompletionItems)
        completionItems = completionItems.concat(getReturnItem(Object.keys(css.config?.semantics ?? {}), 10))

        if (language == 'tsx' || language == 'vue' || language == 'jsx') {
            return haveDash(key, completionItems)
        }
        return completionItems
    }

    if (masterCssKeys.includes(key) && key !== null && isMedia === true) { //show media
        completionItems = completionItems.concat(getReturnItem(masterCssMedia as any, 10))
        // todo: refactor theme
        completionItems = completionItems.concat(getReturnItem(['light', 'dark'], 10))
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerCharacter !== '@' && triggerCharacter !== ':') {
            return haveDash('@' + last, completionItems)
        }
        return completionItems
    }

    if (invoked) {
        return completionItems
    } else if (masterCssKeys.includes(key) && haveValue <= 2 && !(haveValue == 2 && triggerCharacter === ':')) {  //show value
        completionItems = completionItems.concat(getReturnItem(masterCssValues, 10))
        completionItems = completionItems.concat(getReturnItem(masterCssCommonValues as any, 13).map(x => { x.sortText = 'z' + x; return x }))
        if (isColorful) {
            completionItems = completionItems.concat(getColorCompletionItems(css))
        }
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerCharacter !== '@' && triggerCharacter !== ':') {
            return haveDash(last, completionItems)
        }
        return completionItems
    }

    if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerCharacter !== '@' && triggerCharacter !== ':') {
        return haveDash(last, completionItems)
    }
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