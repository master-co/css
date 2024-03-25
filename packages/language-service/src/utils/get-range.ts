import { TextDocument, Range } from 'vscode-languageserver-textdocument'
import settings from '../settings'

// todo: unstable range calculation
export default function getRange(searchString: string, doc: TextDocument): Range {
    const text = doc.getText()
    const regex = new RegExp(`(\\b(?:${settings.classAttributes?.join('|')})\\s?=\\s?(['"\`]))(.*?)\\2`, 'g')
    const classAttMatch = regex.exec(text)
    if (classAttMatch) {
        const attrIndex = classAttMatch.index + classAttMatch[1].length
        const className = classAttMatch[3]
        const index = className.indexOf(searchString)
        return {
            start: doc.positionAt(attrIndex + index),
            end: doc.positionAt(attrIndex + index + searchString.length)
        }
    } else {
        throw new Error(`Cannot find ${searchString} in ${text}`)
    }
}