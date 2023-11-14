import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api'

import { positionCheck, getColorPresentation, getDocumentColors, getCompletionItem, getLastInstance, getReturnItem, doHover, settings }
    // from '../../../../../../css/packages/language-service/src' // dev
    from '@master/css-language-service'

export function CompletionItemProvider(document: monaco.editor.ITextModel, position: monaco.Position, language: string = 'html') {

    const word = document.getWordUntilPosition(position)
    const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
    }

    const text = document.getValue()
    const positionIndex = document.getOffsetAt(position) ?? 0
    const startIndex = document.getOffsetAt({ lineNumber: position.lineNumber - 100, column: 0 }) ?? 0
    const endIndex = document.getOffsetAt({ lineNumber: position.lineNumber + 100, column: 0 }) ?? undefined


    const result: any = []

    if (language === 'javascript') {
        result.push(...getReturnItem([
            'classes',
            'colors',
            'viewports',
            'mediaQueries',
            'selectors',
            'semantics',
            'values',
            'rootSize',
            'scope',
            'important',
            'scheme',
            'override',
            'observe'
        ], 10))
    }

    const inMasterCSS = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, settings.classMatch).IsMatch

    const line = document.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 0,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    })

    let lineText: string = line == null ? '' : line
    lineText = lineText.trim()

    const lastInstance = getLastInstance(lineText, monacoPositionToVsCodePosition(position), language)

    if (lastInstance.isInstance === true && inMasterCSS) {
        result.push(...getCompletionItem(
            lastInstance.lastKey,
            lastInstance.triggerKey,
            lastInstance.isStart,
            lastInstance.language
        ))
    }

    return {
        suggestions: result.map((x: any) => (
            {
                label: x.label,
                kind: x.kind ?? 18,
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
            })),
    }
}

export function HoverItemProvider(textDocumentPosition: monaco.Position, document: monaco.editor.ITextModel) {
    const position = textDocumentPosition

    const text = document.getValue()

    const positionIndex = document.getOffsetAt(position) ?? 0
    const startIndex = document.getOffsetAt({ lineNumber: position.lineNumber - 100, column: 0 }) ?? 0
    const endIndex = document.getOffsetAt({ lineNumber: position.lineNumber + 100, column: 0 }) ?? undefined

    const HoverInstance = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, settings.classMatch)
    if (HoverInstance.IsMatch) {
        const result = doHover(HoverInstance.instance.instanceString, indexToVsCodeRange(HoverInstance.instance.index, document))
        if (result) {
            return {
                range: vsCodeRangeToMonacoRange(result.range as any),
                contents: (result.contents as any[]).map(x => {
                    if (x.language === 'css') {
                        return { value: '```css\n' + x.value + '\n```' }
                    } else {
                        return x
                    }
                })
            }
        }
    }
}

export async function DocumentColorsProvider(document: monaco.editor.ITextModel) {

    const text = document.getValue()

    const colorIndexs = await getDocumentColors(text)

    const colorIndexSet = new Set()
    return colorIndexs
        .filter(item => {
            if (colorIndexSet.has(item.index.start)) {
                return false
            } else {
                colorIndexSet.add(item.index.start)
                return true
            }
        })
        .map(x => ({
            color: x.color, range: indexToMonacoRange(x.index, document)
        }))
}

export function ColorPresentationProvider(document: monaco.editor.ITextModel, colorInfo: monaco.languages.IColorInformation) {

    const colorRender = ['(?<=colors:\\s*{\\s*.*)([^}]*)}']

    const text = document.getValue()

    const positionIndex = document.getOffsetAt({ lineNumber: colorInfo.range.startLineNumber, column: colorInfo.range.startColumn }) ?? 0
    const startIndex = document.getOffsetAt({ lineNumber: colorInfo.range.startLineNumber - 100, column: 0 }) ?? 0
    const endIndex = document.getOffsetAt({ lineNumber: colorInfo.range.startLineNumber + 100, column: 0 }) ?? undefined

    const isColorRender = positionCheck(text.substring(startIndex, endIndex), positionIndex, startIndex, colorRender)

    const documentColors = getColorPresentation({ color: colorInfo.color, range: monacoRangeToVsCodeRange(colorInfo.range) } as any, isColorRender.IsMatch)

    return documentColors.map(x => ({ label: x.label, textEdit: { range: colorInfo.range, text: x.textEdit?.newText ?? '' } }))
}

function monacoRangeToVsCodeRange(range: monaco.IRange) {
    return {
        start: {
            line: range.startLineNumber,
            character: range.startColumn
        },
        end: {
            line: range.endLineNumber,
            character: range.endColumn
        }
    }
}

function vsCodeRangeToMonacoRange(range: { start: { line: number, character: number }, end: { line: number, character: number } }) {
    return {
        startLineNumber: range.start.line,
        startColumn: range.start.character,
        endLineNumber: range.end.line,
        endColumn: range.end.character
    }
}

function indexToMonacoRange(index: { start: number, end: number }, document: monaco.editor.ITextModel) {
    const startPosition = document.getPositionAt(index.start)
    const endPosition = document.getPositionAt(index.end)
    return {
        startLineNumber: startPosition.lineNumber,
        startColumn: startPosition.column,
        endLineNumber: endPosition.lineNumber,
        endColumn: endPosition.column
    }
}

function indexToVsCodeRange(index: { start: number, end: number }, document: monaco.editor.ITextModel) {
    return {
        start: monacoPositionToVsCodePosition(document.getPositionAt(index.start)),
        end: monacoPositionToVsCodePosition(document.getPositionAt(index.end))
    }
}

function monacoPositionToVsCodePosition(position: monaco.Position) {
    return {
        line: position.lineNumber,
        character: position.column
    }
}