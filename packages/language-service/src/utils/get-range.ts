import { TextDocument, Range } from 'vscode-languageserver-textdocument'

export default function getRange(searchString: string, doc: TextDocument): Range {
    const text = doc.getText()
    // let offset = -1
    // const match = text.match(/(['"])(.*?)\1/)
    // if (match) {
    //     offset = match?.index || 0 + 1
    // }
    const offset = text.indexOf(searchString)
    if (offset === -1) {
        throw new Error(`Cannot find ${searchString} in ${text}`)
    }
    return {
        start: doc.positionAt(offset),
        end: doc.positionAt(offset + searchString.length)
    }
}