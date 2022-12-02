import {
    masterCssKeyValues,
    masterCssSelectors,
    masterCssElements,
    masterCssMedia,
    masterCssOtherKeys,
    masterCssType,
    masterCssCommonValues
} from './constant'

import {
    TextDocuments,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import MasterCSS from '@master/css';
import { pascalCase } from 'pascal-case';

let cssKeys: Array<string | CompletionItem> = [];
cssKeys = cssKeys.concat(masterCssOtherKeys);
masterCssKeyValues.forEach(x => {
    cssKeys = cssKeys.concat(x.key);
})

const masterCssKeys: Array<string | CompletionItem> = [...new Set(cssKeys)];

export function GetLastInstance(textDocumentPosition: TextDocumentPositionParams, documents: TextDocuments<TextDocument>) {
    const documentUri = textDocumentPosition.textDocument.uri;
    let language = documentUri.substring(documentUri.lastIndexOf('.') + 1);
    const position = textDocumentPosition.position;

    let classPattern = /(?:[^"{'\s])+(?=>\s|\b)/g;
    let classMatch: RegExpExecArray | null;
    let lastKey = '';

    let document = documents.get(documentUri);
    let line = document?.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line, character: position.character },
    })

    let lineText: string = line == null ? '' : line;
    lineText = lineText.trim();

    let text = document?.getText({
        start: { line: 0, character: 0 },
        end: { line: position.line, character: position.character },
    });


    if (lineText.match(classPattern) === null) {
        return { isInstance: false, lastKey: '', triggerKey: '', isStart: false, language: language };
    }
    else {
        while ((classMatch = classPattern.exec(lineText)) !== null) {
            lastKey = classMatch[0];
        }
    }

    let triggerKey = lineText.charAt(lineText.length - 1);
    let isStart = position.character == 1 || lineText.charAt(lineText.length - 2) === ' ' || lineText.charAt(lineText.length - 2) === '' || lineText.charAt(lineText.length - 2) === "\"" || lineText.charAt(lineText.length - 2) === "\'" || lineText.charAt(lineText.length - 2) === '{';

    if (lineText.charAt(lineText.length - 2) === ':' && lineText.charAt(lineText.length - 1) === ':') {
        triggerKey = '::';
        isStart = false;
    }

    return { isInstance: true, lastKey: lastKey, triggerKey: triggerKey, isStart: isStart, language: language };
}

export function GetCompletionItem(instance: string, triggerKey: string, startWithSpace: boolean, language: string, masterCss: MasterCSS = new MasterCSS()) {

    let masterStyleCompletionItem: CompletionItem[] = [];
    let haveValue = instance.split(':').length;
    let key = instance.split(':')[0];
    key = key.trim();
    let instanceLength = instance.split(':|@').length;
    let last = instance.split(':|@')[instanceLength - 1];

    const mediaPattern = /[^\\s"]+@+([^\\s:"@]+)/g;
    const elementsPattern = /[^\\s"]+::+([^\\s:"@]+)/g;

    let isColorful = false;
    let isMedia = !(mediaPattern.exec(instance) === null && triggerKey !== '@');
    let isElements = !(elementsPattern.exec(instance) === null && triggerKey !== '::');

    let masterCssValues: Array<string | CompletionItem> = [];
    const masterCustomSelectors = Object.keys(masterCss.config.selectors ?? {})
        .map(x => x.endsWith('(') ? `${x})` : x)    
        .filter(x => x.match(/:[^\:]+/) && !masterCssSelectors.find(existedSelector => (typeof existedSelector === 'string' ? existedSelector : existedSelector.label) === `:${x}`))
        .map(x => {
            x = x.substring(1);
            if (x.endsWith(')')) {
                return { label: x, kind: CompletionItemKind.Function };
            }
            return x;
        });
    console.log(masterCustomSelectors);
    const masterCustomElements = Object.keys(masterCss.config.selectors ?? {})
        .map(x => x.endsWith('(') ? `${x})` : x)
        .filter(x => x.match(/::[^\:]+/) && !masterCssElements.find(existedElement => (typeof existedElement === 'string' ? existedElement : existedElement.label) === `::${x}`))
        .map(x => {
            x = x.substring(2);
            if (x.endsWith(')')) {
                return { label: x, kind: CompletionItemKind.Function };
            }
            return x;
        });
    
    masterCssKeyValues.forEach(x => {
        if (x.key.includes(key)) {
            masterCssValues = masterCssValues.concat(
                x.values.filter(cssValue => 
                    !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === (typeof cssValue === 'string' ? cssValue : cssValue.label))
                )
            );
            const pascalCaseFullKey = pascalCase(x.key[0]);
            if (masterCss.config.values?.[pascalCaseFullKey]) {
                const masterCustomValues = Object.keys(masterCss.config.values[pascalCaseFullKey]);
                masterCssValues = masterCssValues.concat(
                    masterCustomValues
                        .filter(customValue => 
                            !masterCssValues.find(existedValue => (typeof existedValue === 'string' ? existedValue : existedValue.label) === customValue)
                        )
                );
            }

            if (x.colorful) {
                isColorful = true;
                const needPushList = masterCssType.find(y => y.type === 'color')?.values.filter(z => !masterCssValues.find(a => (typeof a === 'string' ? a : a.label) === (typeof z === 'string' ? z : z.label)));
                if (needPushList) {
                    masterCssValues = masterCssValues.concat(needPushList);
                }
            }
        }
    })

    if (startWithSpace == true && triggerKey !== "@" && triggerKey !== ":") {  //ex " background"
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssKeys, CompletionItemKind.Property, ':'));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCss.config.semantics ?? {}), CompletionItemKind.Property));

        if (language == 'tsx' || language == 'vue' || language == 'jsx') {
            return HaveDash(key, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;
    }
    else if (startWithSpace == true) {  //triggerKey==@|: //ex " :"
        return []
    }

    if (!masterCssKeys.includes(key) && triggerKey !== ":") {        //show key //ex "backgr"
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssKeys, CompletionItemKind.Property, ':'));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCss.config.semantics ?? {}), CompletionItemKind.Property));
        if (language == 'tsx' || language == 'vue' || language == 'jsx') {
            return HaveDash(key, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;
    }

    if (masterCssKeys.includes(key) && key !== null && isElements === true) { //show elements
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssElements, CompletionItemKind.Property));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomElements, CompletionItemKind.Property));
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== "@" && triggerKey !== ":") {
            return HaveDash(last, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;
    }

    if (masterCssKeys.includes(key) && key !== null && isMedia === true) { //show media
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssMedia, CompletionItemKind.Property));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(Object.keys(masterCss.config.breakpoints ?? {}), CompletionItemKind.Property));
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== "@" && triggerKey !== ":") {
            return HaveDash('@' + last, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;
    }

    if (Object.keys(masterCss.config.semantics ?? {}).includes(key) && !masterCssKeyValues.find(x => x.key.includes(key))) {
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssSelectors, CompletionItemKind.Property));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomSelectors, CompletionItemKind.Property));
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== "@" && triggerKey !== ":") {
            return HaveDash(last, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;

    }
    else if (masterCssKeys.includes(key) && haveValue <= 2 && !(haveValue == 2 && triggerKey === ':')) {  //show value
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssValues, CompletionItemKind.Enum));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssCommonValues, CompletionItemKind.Enum).map(x => {x.sortText = 'z'+x; return x;}));

        if (isColorful) {
            masterStyleCompletionItem = masterStyleCompletionItem.concat(getColorsItem(masterCss));
        }
        if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== "@" && triggerKey !== ":") {
            return HaveDash(last, masterStyleCompletionItem);
        }
        return masterStyleCompletionItem;
    }

    if (masterCssKeys.includes(key) && (haveValue == 2 && triggerKey === ':' || haveValue >= 3) || masterCssKeyValues.find(x => x.values.includes(key))) { //show select
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCssSelectors, CompletionItemKind.Function));
        masterStyleCompletionItem = masterStyleCompletionItem.concat(getReturnItem(masterCustomSelectors, CompletionItemKind.Property));
    }

    if ((language == 'tsx' || language == 'vue' || language == 'jsx') && triggerKey !== "@" && triggerKey !== ":") {
        return HaveDash(last, masterStyleCompletionItem);
    }
    return masterStyleCompletionItem;
}


function getReturnItem(items: Array<string | CompletionItem>, kind: CompletionItemKind, insertText = ''): CompletionItem[] {
    let masterStyleCompletionItem: CompletionItem[] = [];

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
            });
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
            });
        }
    });
    return masterStyleCompletionItem;
}




function getColorsItem(masterCss: MasterCSS = new MasterCSS()): CompletionItem[] {

    let masterStyleCompletionItem: CompletionItem[] = [];

    Object.keys(masterCss.colorsThemesMap)
        .forEach((colorName: string) => {
            const colors = masterCss.colorsThemesMap[colorName];
            Object.keys(colors)
                .forEach((level: string) => {
                    const colorValue: any = masterCss.colorsThemesMap[colorName][level];
                    try {
                        if (level === '') {
                            masterStyleCompletionItem.push({
                                label: colorName,
                                documentation: Object.values<string>(colorValue)[0],
                                kind: CompletionItemKind.Color,
                                sortText: `${colorName}`
                            });
                        } else if (!isNaN(+level)) {
                            masterStyleCompletionItem.push({
                                label: colorName + '-' + level,
                                documentation: Object.values<string>(colorValue)[0],
                                kind: CompletionItemKind.Color,
                                sortText: `${colorName}-${(level).toString().padStart(2, '0')}`
                            });
                        }
                    } catch (_) { }
                });
        });

    return masterStyleCompletionItem;
}

function HaveDash(str: string, itemList: CompletionItem[]): CompletionItem[] {
    let completionItem: CompletionItem[] = [];
    if (str.split('-').length - 1 <= 0) {
        return itemList;
    }
    else {
        let start = str.split('-')[0] + '-';
        itemList.map(x => {
            if (x.label.includes(start)) {
                completionItem.push({
                    label: x.label,
                    kind: x.kind,
                    insertText: x.insertText?.substring(start.length),
                    insertTextMode: x.insertTextMode,
                    command: x.command
                }
                );
            }
        });
        return completionItem;
    }
}

