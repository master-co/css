import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { Position, CompletionItemKind as masterCssCompletionItemKind } from './masterCssinterface'

import { GetLastInstance as masterCssGetLastInstance } from './completionProvider';
import { GetCompletionItem as masterCssGetCompletionItem } from './completionProvider';
import { GetDocumentColors as masterCssGetDocumentColors } from './documentColorProvider';
import { GetColorPresentation as masterCssGetColorPresentation } from './documentColorProvider';
import { doHover } from './hoverProvider';
import { GetMasterInstance } from './masterCss';

export function GetLastInstance(textDocumentPosition: monaco.Position, documents: monaco.editor.ITextModel, language: string = 'html') {

    const position = textDocumentPosition;
    const postionFormaster: Position = { line: textDocumentPosition.lineNumber, character: textDocumentPosition.column }

    let line = documents.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    })

    let lineText: string = line == null ? '' : line;
    lineText = lineText.trim();

    let text = documents.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    });

    return masterCssGetLastInstance(text, lineText, postionFormaster, language);
}

export function GetCompletionItem(instance: string, triggerKey: string, startWithSpace: boolean, language: string, range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
}) {

    var masterCssCompletionItem = masterCssGetCompletionItem(instance, triggerKey, startWithSpace, language);

    let completionItemList: monaco.languages.CompletionItem[] = [];
    masterCssCompletionItem.map(x => {
        completionItemList.push(
            {
                label: x.label,
                kind: GetMonacoCompletionItemKind(x.kind ?? 18),
                documentation: x.documentation,
                insertText: x.label,
                sortText: x.sortText,
                range: range,
                command: x.label.endsWith(':')
                    ? {
                        title: 'triggerSuggest',
                        id: 'editor.action.triggerSuggest'
                    }
                    : undefined
            })
    })
    return completionItemList;

}

export enum CompletionItemKind {
    Method = 0,
    Function = 1,
    Constructor = 2,
    Field = 3,
    Variable = 4,
    Class = 5,
    Struct = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Event = 10,
    Operator = 11,
    Unit = 12,
    Value = 13,
    Constant = 14,
    Enum = 15,
    EnumMember = 16,
    Keyword = 17,
    Text = 18,
    Color = 19,
    File = 20,
    Reference = 21,
    Customcolor = 22,
    Folder = 23,
    TypeParameter = 24,
    User = 25,
    Issue = 26,
    Snippet = 27
}
function GetMonacoCompletionItemKind(itemKind: masterCssCompletionItemKind) {
    switch (itemKind) {
        case masterCssCompletionItemKind.Text:
            return CompletionItemKind.Text;
            break;
        case masterCssCompletionItemKind.Method:
            return CompletionItemKind.Method;
            break;
        case masterCssCompletionItemKind.Function:
            return CompletionItemKind.Function;
            break;
        // case masterCssCompletionItemKind.caseructor:
        //     return CompletionItemKind.caseructor;
        //     break;
        case masterCssCompletionItemKind.Variable:
            return CompletionItemKind.Variable;
            break;
        case masterCssCompletionItemKind.Class:
            return CompletionItemKind.Class;
            break;
        case masterCssCompletionItemKind.Interface:
            return CompletionItemKind.Interface;
            break;
        case masterCssCompletionItemKind.Module:
            return CompletionItemKind.Module;
            break;
        case masterCssCompletionItemKind.Property:
            return CompletionItemKind.Property;
            break;
        case masterCssCompletionItemKind.Unit:
            return CompletionItemKind.Unit;
            break;
        case masterCssCompletionItemKind.Value:
            return CompletionItemKind.Value;
            break;
        case masterCssCompletionItemKind.Enum:
            return CompletionItemKind.Enum;
            break;
        case masterCssCompletionItemKind.Keyword:
            return CompletionItemKind.Keyword;
            break;
        case masterCssCompletionItemKind.Snippet:
            return CompletionItemKind.Snippet;
            break;
        case masterCssCompletionItemKind.Color:
            return CompletionItemKind.Color;
            break;
        case masterCssCompletionItemKind.File:
            return CompletionItemKind.File;
            break;
        case masterCssCompletionItemKind.Reference:
            return CompletionItemKind.Reference;
            break;
        case masterCssCompletionItemKind.Folder:
            return CompletionItemKind.Folder;
            break;
        case masterCssCompletionItemKind.EnumMember:
            return CompletionItemKind.EnumMember;
            break;
            // case masterCssCompletionItemKind.caseant:
            //     return CompletionItemKind.caseant;
            break;
        case masterCssCompletionItemKind.Event:
            return CompletionItemKind.Event;
            break;
        case masterCssCompletionItemKind.Operator:
            return CompletionItemKind.Operator;
            break;
        case masterCssCompletionItemKind.TypeParameter:
            return CompletionItemKind.TypeParameter;
            break;
        default:
            return CompletionItemKind.User;
            break;
    }
}

export function GetHoverItem(textDocumentPosition: monaco.Position, documents: monaco.editor.ITextModel, language: string = 'html') {
    const position = textDocumentPosition;
    const postionFormaster: Position = { line: textDocumentPosition.lineNumber, character: textDocumentPosition.column }

    let line = documents.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber + 1,
        endColumn: 1
    })

    let lineText: string = line == null ? '' : line;


    let text = documents.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    });


    let masterInstance = GetMasterInstance(text, lineText, postionFormaster, language);

    var result = doHover(masterInstance.instance, masterInstance.range)

    if (result != null) {
        return {
            range: {
                startLineNumber: position.lineNumber,
                startColumn: result.range.start.character + 1,
                endLineNumber: position.lineNumber,
                endColumn: result.range.end.character + 1
            },
            contents: [
                { value: '```css\n' +result.contents.value + '\n```' }
            ]
        };
    }
}

export function GetDocumentColors(documents: monaco.editor.ITextModel, language: string = 'html') {

    let text = documents.getValue();

    let masterCssDocumentColors = masterCssGetDocumentColors(text, language);

    let documentColors: {
        color: {
            red: number;
            green: number;
            blue: number;
            alpha: number;
        };
        range: monaco.IRange;
    }[] = [];

    masterCssDocumentColors.map(x => {
        let colorRange: monaco.IRange = {
            startLineNumber: documents.getPositionAt(x.index.start).lineNumber,
            startColumn: documents.getPositionAt(x.index.start).column,
            endLineNumber: documents.getPositionAt(x.index.end).lineNumber,
            endColumn: documents.getPositionAt(x.index.end).column
        }
        documentColors.push({
            color: x.color,
            range: colorRange,
        })
    })
    return documentColors;
}
export function GetColorPresentation(colorInfo: monaco.languages.IColorInformation, language: string = 'html') {


    const postionFormaster: { start: Position, end: Position } = { start: { line: colorInfo.range.startLineNumber, character: colorInfo.range.startColumn }, end: { line: colorInfo.range.endLineNumber, character: colorInfo.range.endColumn } }
    let documentColors = masterCssGetColorPresentation(colorInfo.color, postionFormaster);

    let monacoDocumentColors: { label: string, textEdit: { range: monaco.IRange, text: string } }[] = [];
    documentColors.map(x => {
        monacoDocumentColors.push({ label: x.label, textEdit: { range: colorInfo.range, text: x.textEdit?.newText ?? '' } })
    }
    )
    return monacoDocumentColors;
}