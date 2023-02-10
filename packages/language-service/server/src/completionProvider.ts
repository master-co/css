import {
    masterCSSKeyValues,
    masterCSSSelectors,
    masterCSSElements,
    masterCSSMedia,
    masterCSSOtherKeys,
    masterCSSType,
    masterCSSCommonValues
} from './constant'

import {
    TextDocuments,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams
} from 'vscode-languageserver/node'
import { TextDocument } from 'vscode-languageserver-textdocument'
import MasterCSS from '@master/css'
import { pascalCase } from 'pascal-case'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCSSOtherKeys)
masterCSSKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

const masterCSSKeys: Array<string | CompletionItem> = [...new Set(cssKeys)]

export function GetLastInstance(textDocumentPosition: TextDocumentPositionParams, documents: TextDocuments<TextDocument>) {
    const documentUri = textDocumentPosition.textDocument.uri
    const language = documentUri.substring(documentUri.lastIndexOf('.') + 1)
    const position = textDocumentPosition.position

    const classPattern = /(?:[^"{'\s])+(?=>\s|\b)/g
    let classMatch: RegExpExecArray | null
    let lastKey = ''

    const document = documents.get(documentUri)
    const line = document?.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    })

    let lineText: string = line == null ? '' : line
    lineText = lineText.trim()

    const text = document?.getText({
        start: { line: 0, character: 0 },
        end: { line: position.line, character: position.character },
    })


    if (lineText.match(classPattern) === null) {
        return { isInstance: false, lastKey: '', triggerKey: '', isStart: false, language: language }
    }
    else {
        while ((classMatch = classPattern.exec(lineText)) !== null) {
            lastKey = classMatch[0]
        }
    }

    let triggerKey = lineText.charAt(lineText.length - 1)
    let isStart = position.character == 1 || lineText.charAt(lineText.length - 2) === ' ' || lineText.charAt(lineText.length - 2) === '' || lineText.charAt(lineText.length - 2) === '"' || lineText.charAt(lineText.length - 2) === '\'' || lineText.charAt(lineText.length - 2) === '{'

    if (lineText.charAt(lineText.length - 2) === ':' && lineText.charAt(lineText.length - 1) === ':') {
        triggerKey = '::'
        isStart = false
    }

    return { isInstance: true, lastKey: lastKey, triggerKey: triggerKey, isStart: isStart, language: language }
}

export function GetCompletionItem(instance: string, triggerKey: string, startWithSpace: boolean, language: string, masterCSS: MasterCSS = new MasterCSS()) {

    let masterStyleCompletionItem: CompletionItem[] = []
    const haveValue = instance.split(':').length
    let key = instance.split(':')[0]
    key = key.trim()
    const instanceLength = instance.split(':|@').length
    const last = instance.split(':|@')[instanceLength - 1]

    const mediaPattern = /[^\\s"]+@+([^\\s:"@]+)/g
    const elementsPattern = /[^\\s"]+::+([^\\s:"@]+)/g

    let isColorful = false
    const isMedia = !(mediaPattern.exec(instance) === null && triggerKey !== '@')
    const isElements = !(elementsPattern.exec(instance) === null && triggerKey !== '::')

    let masterCSSValues: Array<string | CompletionItem> = []
    const masterCustomSelectors = Object.keys(masterCSS.config.selectors ?? {})
        .map(x => x.endsWith('(') ? `${x})` : x)
        .filter(x => x.match(/:[^:]+/) && !masterCSSSelectors.find(existedSelector => (typeof existedSelector === 'string' ? existedSelector : existedSelector.label) === `:${x}`))
        .map(x => {
            x = x.substring(1)
            if (x.endsWith(')')) {
                return { label: x, kind: CompletionItemKind.Function }
            }
            return x
        })

    const masterCustomElements = Object.keys(masterCSS.config.selectors ?? {})
        .map(x => x.endsWith('(') ? `${x})` : x)
        .filter(x => x.match(/::[^:]+/) && !masterCSSElements.find(existedElement => (typeof existedElement === 'string' ? existedElement : existedElement.label) === `::${x}`))
        .map(x => {
            x = x.substring(2)
            if (x.endsWith(')')) {
                return { label: x, kind: CompletionItemKind.Function }
            }
            return x
        })

    masterCSSKeyValues.forEach(x => {
        if (x.key.includes(key)) {
            masterCSSValues = masterCSSValues.concat(
                x.values.filter(cssValue =>
                    !masterCSSValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
                )
            )
            const pascalCaseFullKey = pascalCase(x.key[0])
            if (masterCSS.config.values?.[pascalCaseFullKey]) {
                const masterCustomValues = Object.keys(masterCSS.config.values[pascalCaseFullKey])
                masterCSSValues = masterCSSValues.concat(
                    masterCustomValues
                        .filter(customValue =>
                            !masterCSSValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === customValue)
                        )
                )
            }

            if (x.colorful) {
                isColorful = true
                const needPushList = masterCSSType.find(y => y.type === 'color')?.values.filter(z => !masterCSSValues.find(a => (typeof a === 'string' ? a : a.label) === (typeof z === 'string' ? z : z.label)))
                if (needPushList) {
                    masterCSSValues = masterCSSValues.concat(needPushList)
                }
            }
        }
    })

    if (startWithSpace == true && triggerKey !== '@' && triggerKey !== ':') {  //ex " background"
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSKeys, CompletionItemKind.Property, ':'))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCSS.config.semantics ?? {}), CompletionItemKind.Property))

        if (language == 'tsx' || language == 'vue' || language == 'jsx') {
            return HaveDash(key, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem
    }
    else if (startWithSpace == true) {  //triggerKey==@|: //ex " :"
        return []
    }

    if (!masterCSSKeys.includes(key) && triggerKey !== ':') {        //show key //ex "backgr"
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSKeys, CompletionItemKind.Property, ':'))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCSS.config.semantics ?? {}), CompletionItemKind.Property))
        if (language == 'tsx' || language == 'vue' || language == 'jsx') {
            return HaveDash(key, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem
    }

    if (masterCSSKeys.includes(key) && key !== null && isElements === true) { //show elements
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSElements, CompletionItemKind.Property))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomElements, CompletionItemKind.Property))
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
            return HaveDash(last, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem
    }

    if (masterCSSKeys.includes(key) && key !== null && isMedia === true) { //show media
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSMedia, CompletionItemKind.Property))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCSS.config.breakpoints ?? {}), CompletionItemKind.Property))
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
            return HaveDash('@' + last, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem
    }

    if (Object.keys(masterCSS.config.semantics ?? {}).includes(key) && !masterCSSKeyValues.find(x => x.key.includes(key))) {
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSSelectors, CompletionItemKind.Property))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomSelectors, CompletionItemKind.Property))
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
            return HaveDash(last, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem

    }
    else if (masterCSSKeys.includes(key) && haveValue <= 2 && !(haveValue == 2 && triggerKey === ':')) {  //show value
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSValues, CompletionItemKind.Enum))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSCommonValues, CompletionItemKind.Enum).map(x => { x.sortText = 'z' + x; return x }))

        if (isColorful) {
            masterStyleCompletionItem = masterStyleCompletionItem.concat(getColorsItem(masterCSS))
        }
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
            return HaveDash(last, masterStyleCompletionItem)
        }
        return masterStyleCompletionItem
    }

    if (masterCSSKeys.includes(key) && (haveValue == 2 && triggerKey === ':' || haveValue >= 3) || masterCSSKeyValues.find(x => x.values.includes(key))) { //show select
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCSSSelectors, CompletionItemKind.Function))
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomSelectors, CompletionItemKind.Property))
    }

    if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
        return HaveDash(last, masterStyleCompletionItem)
    }
    return masterStyleCompletionItem
}


function getReturnItem(items: Array<string | CompletionItem>, kind: CompletionItemKind, insertText = ''): CompletionItem[] {
    const masterStyleCompletionItem: CompletionItem[] = []

    items.forEach(x => {
        if (typeof x === 'string') {
            masterStyleCompletionItem.push({
                label: x + insertText,
                kind: kind,
                insertText: x + insertText,
                insertTextMode: 2,
                command: insertText === ':'
                    ? {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                    : undefined
            })
        } else {
            masterStyleCompletionItem.push({
                insertText: x.label + insertText,
                insertTextMode: 2,
                command: insertText === ':'
                    ? {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                    : undefined
                ,
                ...x
            })
        }
    })
    return masterStyleCompletionItem
}




function getColorsItem(masterCSS: MasterCSS = new MasterCSS()): CompletionItem[] {

    const masterStyleCompletionItem: CompletionItem[] = []

    Object.keys(masterCSS.colorThemesMap)
        .forEach((colorName: string) => {
            const colorValue: any = masterCSS.colorThemesMap[colorName]
            masterStyleCompletionItem.push({
                label: colorName,
                documentation: Object.values<string>(colorValue)[0],
                kind: CompletionItemKind.Color,
                sortText: `${colorName}`
            })
        })

    return masterStyleCompletionItem
}

function HaveDash(str: string, itemList: CompletionItem[]): CompletionItem[] {
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

