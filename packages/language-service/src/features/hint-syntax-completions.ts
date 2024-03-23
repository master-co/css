import { masterCssKeyValues, masterCssMedia, masterCssOtherKeys, masterCssType, masterCssCommonValues } from '../constant'
import type { CompletionItem, CompletionItemKind, CompletionParams } from 'vscode-languageserver'
import type { Position, TextDocument } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../core'
import cssDataProvider from '../utils/css-data-provider'
import getPseudoElementCompletionItems from '../utils/get-pseudo-element-completion-items'
import getPseudoClassCompletionItems from '../utils/get-pseudo-class-completion-items'
import getColorCompletionItems from '../utils/get-color-completion-items'

let cssKeys: Array<string | CompletionItem> = []
cssKeys = cssKeys.concat(masterCssOtherKeys)
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key)
})

const masterCssKeys: Array<string | CompletionItem> = [...new Set(cssKeys)]

export default function hintSyntaxCompletions(this: CSSLanguageService, document: TextDocument, { position }: CompletionParams,): CompletionItem[] | undefined {
    const language = document.uri.substring(document.uri.lastIndexOf('.') + 1)
    const checkResult = this.getPosition(document, position)
    const lineText: string = document.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    }).trim()
    const { isInstance, triggerKey, lastKey, isStart } = getLastInstance(lineText, position)
    if (isInstance === true && checkResult) {
        const key = lastKey.split(':')[0].trim()
        const haveValue = lastKey.split(':').length
        const instanceLength = lastKey.split(':|@').length
        const last = lastKey.split(':|@')[instanceLength - 1]
        const mediaPattern = /[^\\s"]+@+([^\\s:"@]+)/g
        const isMedia = !(mediaPattern.exec(lastKey) === null && triggerKey !== '@')
        let completionItems: CompletionItem[] = []
        let isColorful = false

        const masterCssKeyCompletionItems: Array<CompletionItem> = []
        let masterCssValues: Array<string | CompletionItem> = []
        if (haveValue >= 2 && (triggerKey === ':' || triggerKey === '::')) {
            switch (triggerKey) {
                case ':':
                    completionItems.push(...getPseudoClassCompletionItems(triggerKey), ...getPseudoElementCompletionItems(triggerKey))
                    break
                case '::':
                    completionItems.push(...getPseudoElementCompletionItems(triggerKey))
                    break
            }
            return completionItems
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

                if (this.css.config?.variables?.[fullKey]) {
                    const masterCustomVariables = Object.keys(this.css.config?.variables[fullKey])
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

        if ((isStart == true || !masterCssKeys.includes(key)) && triggerKey !== '@' && triggerKey !== ':') {  //ex " background"
            completionItems = completionItems.concat(masterCssKeyCompletionItems)
            completionItems = completionItems.concat(getReturnItem(Object.keys(this.css.config?.semantics ?? {}), 10))

            if (language == 'tsx' || language == 'vue' || language == 'jsx') {
                return HaveDash(key, completionItems)
            }
            return completionItems
        }
        else if (isStart == true) {  //triggerKey==@|: //ex " :"
            return []
        }

        if (masterCssKeys.includes(key) && key !== null && isMedia === true) { //show media
            completionItems = completionItems.concat(getReturnItem(masterCssMedia as any, 10))
            // todo: refactor theme
            completionItems = completionItems.concat(getReturnItem(['light', 'dark'], 10))
            if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
                return HaveDash('@' + last, completionItems)
            }
            return completionItems
        }

        if (Object.keys(this.css.config?.semantics ?? {}).includes(key) && !masterCssKeyValues.find(x => x.key.includes(key))) {
            if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
                return HaveDash(last, completionItems)
            }
            return completionItems

        } else if (masterCssKeys.includes(key) && haveValue <= 2 && !(haveValue == 2 && triggerKey === ':')) {  //show value
            completionItems = completionItems.concat(getReturnItem(masterCssValues, 10))
            completionItems = completionItems.concat(getReturnItem(masterCssCommonValues as any, 13).map(x => { x.sortText = 'z' + x; return x }))
            if (isColorful) {
                completionItems = completionItems.concat(getColorCompletionItems(this.css))
            }
            if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
                return HaveDash(last, completionItems)
            }
            return completionItems
        }

        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== '@' && triggerKey !== ':') {
            return HaveDash(last, completionItems)
        }
        return completionItems
    } else if (isInstance === true && checkConfigColorsBlock(document, position) === true) {
        return getColorCompletionItems(this.css)
    }
}

// temporary
export function checkConfigColorsBlock(document: TextDocument, position: Position) {
    const lineText: string = (document?.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    }) ?? '').trim()

    if ((lineText.match(/'|"|`/g)?.length ?? 0) % 2 === 0) {
        return false
    }
    for (let i = position.line; i > 0; i--) {
        const text = document.getText({
            start: {
                line: i - 1,
                character: 0
            },
            end: {
                line: i,
                character: 0
            }
        })
        if (text.includes('}')) {
            return false
        } else if (text.includes('colors:')) {
            return true
        }
    }
    return false
}

export function getLastInstance(lineText: string, position: Position) {
    const classPattern = /(?:[^"{'\s])+(?=>\s|\b)/g
    let classMatch: RegExpExecArray | null
    let lastKey = ''

    let triggerKey = lineText.charAt(lineText.length - 1)
    let isStart = position.character == 1 || lineText.charAt(lineText.length - 2) === ' ' || lineText.charAt(lineText.length - 2) === '' || lineText.charAt(lineText.length - 2) === '"' || lineText.charAt(lineText.length - 2) === '\'' || lineText.charAt(lineText.length - 2) === '{'

    if (lineText.match(classPattern) === null) {
        return { isInstance: false, lastKey: '', triggerKey: '', isStart: false }
    }
    else {
        while ((classMatch = classPattern.exec(lineText)) !== null) {
            lastKey = classMatch[0]
        }
    }

    if (lineText.charAt(lineText.length - 2) === ':' && lineText.charAt(lineText.length - 1) === ':') {
        triggerKey = '::'
        isStart = false
    }

    return { isInstance: true, lastKey: lastKey, triggerKey: triggerKey, isStart: isStart }
}

export function getReturnItem(items: Array<string | CompletionItem>, kind: CompletionItemKind): CompletionItem[] {
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

