import { TextDocument, Range } from 'vscode-languageserver-textdocument'

export default function getRange(searchString: string, doc: TextDocument): Range {
    const text = doc.getText()
    const regex = new RegExp(`(\\b(?:className|class)\\s*=\\s*(['"\`]))(.*?)\\2`, 'gs')

    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0]
        const attrStartIndex = match.index + match[1].length
        const className = match[3]

        const relativeIndex = className.indexOf(searchString)
        if (relativeIndex !== -1) {
            const absoluteIndex = attrStartIndex + relativeIndex
            return {
                start: doc.positionAt(absoluteIndex),
                end: doc.positionAt(absoluteIndex + searchString.length)
            }
        }
    }

    throw new Error(`Cannot find "${searchString}" in any class attribute.`)
}