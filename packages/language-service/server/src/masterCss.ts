import {
    TextDocuments,
    Position,
} from 'vscode-languageserver/node'
import { Range, TextDocument } from 'vscode-languageserver-textdocument'
import { instancePattern } from './utils/regex'

export function PositionCheck(documentUri: string, position: Position, documents: TextDocuments<TextDocument>, RegExpList: string[]) {
    const result: {
        IsMatch: boolean,
        PositionIndex: number,
        classStartIndex: number,
        classEndIndex: number,
        classString: string,
        instance: { range: Range, instanceString: string },
        instanceList: { range: Range, instanceString: string }[],
    } = {
        IsMatch: false,
        PositionIndex: 0,
        classStartIndex: 0,
        classEndIndex: 0,
        classString: '',
        instance: { range: { start: Position.create(0, 0), end: Position.create(0, 0) }, instanceString: '' },
        instanceList: [],
    }

    const document = documents.get(documentUri)
    let text = document?.getText() ?? ''
    const positionIndex = document?.offsetAt(position) ?? 0

    const startIndex = document?.offsetAt({ line: position.line - 100, character: 0 }) ?? 0
    const endIndex = document?.offsetAt({ line: position.line + 100, character: 0 }) ?? undefined
    text = text.substring(startIndex, endIndex)

    let instanceMatch: RegExpExecArray | null
    let classMatch: RegExpExecArray | null

    result.PositionIndex = positionIndex

    RegExpList.forEach(x => {
        const classPattern = new RegExp(x, 'g')

        while ((classMatch = classPattern.exec(text)) !== null) {
            if ((classMatch.index <= positionIndex && classMatch.index + classMatch[0].length - 1 >= positionIndex) == true) {
                result.IsMatch = true
                result.PositionIndex = positionIndex
                result.classStartIndex = classMatch.index
                result.classEndIndex = classMatch.index + classMatch[0].length - 1
                result.classString = classMatch[0]

                while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                    result.instanceList.push(
                        {
                            range: {
                                start: document?.positionAt(classMatch.index + classMatch[1].length + instanceMatch.index) ?? Position.create(0, 0),
                                end: document?.positionAt(classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length) ?? Position.create(0, 0)
                            },
                            instanceString: instanceMatch[0]
                        }
                    )
                    if ((classMatch.index + classMatch[1].length + instanceMatch.index <= positionIndex && classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length >= positionIndex) == true) {
                        result.instance = {
                            range: {
                                start: document?.positionAt(classMatch.index + classMatch[1].length + instanceMatch.index) ?? Position.create(0, 0),
                                end: document?.positionAt(classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length) ?? Position.create(0, 0)
                            },
                            instanceString: instanceMatch[0]
                        }
                    }
                }

                return result
            }
            else if (classMatch.index > positionIndex) {
                break
            }
        }
    })
    return result
}